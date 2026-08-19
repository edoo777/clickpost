"use client";

import Link from "next/link";
import { useState } from "react";
import {
  TopicGeneratorForm,
  type TopicGeneratorFormErrors,
  type TopicGeneratorFormValue,
} from "@/components/topic-generator/TopicGeneratorForm";
import { TopicBatchList } from "@/components/topic-generator/TopicBatchList";
import { TopicBatchResults } from "@/components/topic-generator/TopicBatchResults";
import { MixedTopicsView } from "@/components/topic-generator/MixedTopicsView";
import { resolvedDistributionTotal } from "@/components/topic-generator/ThemeSelectionPanel";
import { buildBalancedDistribution, type ContentTypeDistribution } from "@/lib/content-types";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import {
  DEFAULT_LOT_SIZE,
  MAX_REQUESTED_PER_THEME,
  MAX_TOTAL_REQUESTED_PER_GENERATION,
  detectDuplicateTopicIds,
  detectExistingIdeaMatches,
  generateTopicsLot,
  normalizeTopicLabel,
  splitDistributionIntoLots,
  splitIntoLotSizes,
  type LotStatus,
  type SharedGenerationParams,
  type ThemeGenerationRequest,
} from "@/lib/topic-generator";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Brand } from "@/types/brand";
import type { Idea } from "@/types/idea";
import type { Topic, TopicBatch } from "@/types/topic-batch";

export type TopicsDisplayMode = "byTheme" | "all";

function buildInitialFormValue(brand: Brand | undefined): TopicGeneratorFormValue {
  return {
    brandId: brand?.id ?? "",
    standaloneNiche: "",
    name: "",
    themeSelections: [],
    targetAudience: "",
    objective: "",
    platforms: brand?.socialPlatforms ?? [],
    formats: ["text"],
    varietyLevel: "medium",
    tone: "professional",
    period: "",
    instructions: "",
  };
}

function distributionFor(selection: TopicGeneratorFormValue["themeSelections"][number]): ContentTypeDistribution[] {
  if (selection.distributionMode === "auto") {
    return buildBalancedDistribution(selection.requestedCount, selection.selectedContentTypes);
  }
  return Object.entries(selection.customDistribution)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([contentType, count]) => ({ contentType: contentType as ContentTypeDistribution["contentType"], count: count ?? 0 }));
}

type TFunc = ReturnType<typeof useTranslations>;

function validateForm(value: TopicGeneratorFormValue, t: TFunc): TopicGeneratorFormErrors {
  const errors: TopicGeneratorFormErrors = {};
  if (value.themeSelections.length === 0) errors.themes = t("topicGenerator.view.errorSelectTheme");
  let total = 0;
  for (const selection of value.themeSelections) {
    if (!Number.isFinite(selection.requestedCount) || selection.requestedCount < 1 || selection.requestedCount > MAX_REQUESTED_PER_THEME) {
      errors.themes = t("topicGenerator.view.errorRequestedRange", { max: MAX_REQUESTED_PER_THEME });
    }
    if (selection.distributionMode === "custom" && resolvedDistributionTotal(selection) !== selection.requestedCount) {
      errors.themes = t("topicGenerator.view.errorCustomDistributionMismatch");
    }
    total += selection.requestedCount;
  }
  if (total > MAX_TOTAL_REQUESTED_PER_GENERATION) {
    errors.themes = t("topicGenerator.view.errorTotalExceeded", { total, max: MAX_TOTAL_REQUESTED_PER_GENERATION });
  }
  // Aucune plateforme sélectionnée est un état volontairement valide : génère des idées
  // générales, indépendantes d'un réseau — jamais bloquant (voir generateur-prompt.ts).
  if (value.formats.length === 0) errors.formats = t("topicGenerator.view.errorSelectFormat");
  return errors;
}

function patchLot(
  prev: Record<string, LotStatus[]>,
  batchId: string,
  index: number,
  patch: Partial<LotStatus>
): Record<string, LotStatus[]> {
  const lots = prev[batchId];
  if (!lots) return prev;
  return { ...prev, [batchId]: lots.map((lot) => (lot.index === index ? { ...lot, ...patch } : lot)) };
}

export function TopicGeneratorView() {
  const t = useTranslations();
  const { brands, activeBrandId } = useBrandsSession();
  const { themes } = useThemesSession();
  const {
    topicBatches,
    topics,
    ideas,
    addTopicBatch,
    updateTopicBatch,
    archiveTopicBatch,
    addTopic,
    updateTopic,
    removeTopic,
    addIdea,
  } = useContentWorkspace();

  const [formValue, setFormValue] = useState<TopicGeneratorFormValue>(() =>
    buildInitialFormValue(brands.find((brand) => brand.id === activeBrandId) ?? brands[0])
  );
  const [formErrors, setFormErrors] = useState<TopicGeneratorFormErrors>({});
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [regenerationRounds, setRegenerationRounds] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lotsByBatch, setLotsByBatch] = useState<Record<string, LotStatus[]>>({});
  const [displayMode, setDisplayMode] = useState<TopicsDisplayMode>("byTheme");
  const [standaloneConfirmed, setStandaloneConfirmed] = useState(false);

  const selectedBrand = brands.find((brand) => brand.id === formValue.brandId);
  const themesForBrand = getActiveThemesForBrand(themes, formValue.brandId);
  const activeGroupBatches = activeGroupId
    ? topicBatches.filter((batch) => (batch.groupId ?? batch.id) === activeGroupId)
    : [];

  function themeLabelFor(batch: TopicBatch): string {
    if (batch.themeId) return themes.find((theme) => theme.id === batch.themeId)?.label ?? t("publications.card.noTheme");
    return batch.adhocThemeLabel ?? t("publications.card.noTheme");
  }

  function nicheForBrandId(brandId: string): string {
    return brands.find((brand) => brand.id === brandId)?.industry ?? "";
  }

  function nicheForBatch(batch: TopicBatch): string {
    return batch.brandId ? nicheForBrandId(batch.brandId) : (batch.standaloneNiche ?? "");
  }

  function handleFormChange(next: TopicGeneratorFormValue) {
    if (next.brandId !== formValue.brandId) {
      setFormValue({ ...next, platforms: [] });
    } else {
      setFormValue(next);
    }
  }

  function batchTopics(batchId: string): Topic[] {
    return topics.filter((topic) => topic.batchId === batchId);
  }

  /**
   * Génère un lot pour une thématique : découpe (déjà faite par l'appelant), un seul appel
   * /api/ia/generateur/topics, dé-doublonnage au sein de la même thématique (jamais entre
   * thématiques différentes), ajout immédiat des sujets obtenus — jamais perdus si un lot
   * ultérieur échoue. Retourne le nombre de sujets réellement ajoutés (après dé-doublonnage).
   */
  async function runSingleLot(
    brandId: string,
    batchId: string,
    request: ThemeGenerationRequest,
    shared: SharedGenerationParams,
    round: number,
    index: number,
    size: number,
    distribution: ContentTypeDistribution[],
    seenLabels: Set<string>
  ): Promise<{ added: number; source: "claude" | "simulated" }> {
    setLotsByBatch((prev) => patchLot(prev, batchId, index, { status: "generating" }));
    const outcome = await generateTopicsLot(brandId, { ...request, requestedCount: size, distribution }, shared, round);

    if ("failure" in outcome) {
      setLotsByBatch((prev) => patchLot(prev, batchId, index, { status: "error", errorMessage: outcome.failure.message }));
      return { added: 0, source: "simulated" };
    }

    const unique = outcome.result.topics.filter((generated) => {
      const key = normalizeTopicLabel(generated.label);
      if (key.length === 0 || seenLabels.has(key)) return false;
      seenLabels.add(key);
      return true;
    });
    unique.forEach((generated) => {
      addTopic({
        id: crypto.randomUUID(),
        batchId,
        label: generated.label,
        selected: false,
        locked: false,
        contentType: generated.contentType,
        angle: generated.angle,
      });
    });
    setLotsByBatch((prev) => patchLot(prev, batchId, index, { status: "success" }));
    return { added: unique.length, source: outcome.result.source };
  }

  /** Reprend uniquement le lot en erreur d'une thématique — ne relance jamais les lots déjà
   * réussis, conformément à la spécification. */
  async function handleRetryLot(batch: TopicBatch, lotIndex: number) {
    const lots = lotsByBatch[batch.id];
    const lot = lots?.find((candidate) => candidate.index === lotIndex);
    if (!lot) return;
    const isStandalone = !batch.brandId;
    const brand = isStandalone ? null : brands.find((b) => b.id === batch.brandId);
    if (!isStandalone && !brand) return;

    const request: ThemeGenerationRequest = {
      themeId: batch.themeId ?? batch.id,
      isAdhoc: !batch.themeId,
      themeLabel: themeLabelFor(batch),
      requestedCount: lot.size,
      distribution: [],
    };
    const distribution = batch.contentTypeDistribution
      ? Object.entries(batch.contentTypeDistribution)
          .filter(([, count]) => (count ?? 0) > 0)
          .map(([contentType, count]) => ({ contentType: contentType as ContentTypeDistribution["contentType"], count: count ?? 0 }))
      : [];
    const niche = nicheForBatch(batch);
    const items = isStandalone
      ? [niche || t("topicGenerator.view.genericTopicFallback")]
      : brand!.productsAndServices.length > 0
        ? brand!.productsAndServices
        : [brand!.name];
    const seenLabels = new Set(batchTopics(batch.id).map((topic) => normalizeTopicLabel(topic.label)));

    setIsGenerating(true);
    try {
      const { added, source } = await runSingleLot(
        isStandalone ? "" : brand!.id,
        batch.id,
        request,
        {
          items,
          niche,
          objective: batch.objective,
          targetAudience: batch.targetAudience,
          tone: batch.tone,
          formats: batch.formats,
          platforms: batch.platforms,
          instructions: batch.instructions,
          varietyLevel: batch.varietyLevel,
        },
        regenerationRounds[batch.id] ?? 0,
        lotIndex,
        lot.size,
        distribution,
        seenLabels
      );
      if (added > 0) {
        updateTopicBatch(batch.id, {
          generatedCount: batchTopics(batch.id).length + added,
          source,
          updatedAt: new Date().toISOString(),
        });
        setSuccessMessage(t("topicGenerator.view.lotRetriedSuccess", { theme: themeLabelFor(batch) }));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  /** Génère un lot supplémentaire au-delà de la quantité initialement demandée pour cette
   * thématique — plafonné à MAX_REQUESTED_PER_THEME au total, jamais au-delà. */
  async function handleGenerateMore(batch: TopicBatch) {
    const isStandalone = !batch.brandId;
    const brand = isStandalone ? null : brands.find((b) => b.id === batch.brandId);
    if (!isStandalone && !brand) return;

    const currentTopics = batchTopics(batch.id);
    const remaining = MAX_REQUESTED_PER_THEME - currentTopics.length;
    if (remaining <= 0) return;
    const size = Math.min(DEFAULT_LOT_SIZE, remaining);

    const niche = nicheForBatch(batch);
    const items = isStandalone
      ? [niche || t("topicGenerator.view.genericTopicFallback")]
      : brand!.productsAndServices.length > 0
        ? brand!.productsAndServices
        : [brand!.name];
    const distribution: ContentTypeDistribution[] = batch.contentTypeDistribution
      ? Object.entries(batch.contentTypeDistribution)
          .filter(([, count]) => (count ?? 0) > 0)
          .map(([contentType, count]) => ({ contentType: contentType as ContentTypeDistribution["contentType"], count: count ?? 0 }))
      : [];
    const request: ThemeGenerationRequest = {
      themeId: batch.themeId ?? batch.id,
      isAdhoc: !batch.themeId,
      themeLabel: themeLabelFor(batch),
      requestedCount: size,
      distribution: [],
    };
    const seenLabels = new Set(currentTopics.map((topic) => normalizeTopicLabel(topic.label)));
    const lotIndex = lotsByBatch[batch.id]?.length ?? 0;
    setLotsByBatch((prev) => ({
      ...prev,
      [batch.id]: [...(prev[batch.id] ?? []), { index: lotIndex, size, status: "pending" as const }],
    }));

    setIsGenerating(true);
    try {
      const { added, source } = await runSingleLot(
        isStandalone ? "" : brand!.id,
        batch.id,
        request,
        {
          items,
          niche,
          objective: batch.objective,
          targetAudience: batch.targetAudience,
          tone: batch.tone,
          formats: batch.formats,
          platforms: batch.platforms,
          instructions: batch.instructions,
          varietyLevel: batch.varietyLevel,
        },
        regenerationRounds[batch.id] ?? 0,
        lotIndex,
        size,
        distribution,
        seenLabels
      );
      if (added > 0) {
        updateTopicBatch(batch.id, {
          requestedCount: batch.requestedCount + size,
          generatedCount: currentTopics.length + added,
          source,
          updatedAt: new Date().toISOString(),
        });
        setSuccessMessage(t("topicGenerator.view.moreIdeasGenerated", { count: added, theme: themeLabelFor(batch) }));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerate() {
    const errors = validateForm(formValue, t);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const isStandalone = !formValue.brandId;
    const brand = isStandalone ? null : brands.find((b) => b.id === formValue.brandId);
    if (!isStandalone && !brand) return;

    const niche = isStandalone ? formValue.standaloneNiche.trim() : (brand?.industry ?? "");
    const items = isStandalone
      ? [niche || t("topicGenerator.view.genericTopicFallback")]
      : brand!.productsAndServices.length > 0
        ? brand!.productsAndServices
        : [brand!.name];

    const requests: { request: ThemeGenerationRequest; selection: TopicGeneratorFormValue["themeSelections"][number] }[] =
      formValue.themeSelections.map((selection) => ({
        selection,
        request: {
          themeId: selection.themeId,
          isAdhoc: selection.isAdhoc,
          themeLabel: selection.themeLabel,
          requestedCount: selection.requestedCount,
          distribution: distributionFor(selection),
        },
      }));
    if (requests.length === 0) return;

    setIsGenerating(true);
    try {
      const groupId = crypto.randomUUID();
      const now = new Date().toISOString();
      let totalGenerated = 0;

      for (const { request, selection } of requests) {
        const batchId = crypto.randomUUID();
        const useFormats = selection.customizeOverrides && selection.formats ? selection.formats : formValue.formats;
        const usePlatforms = selection.customizeOverrides && selection.platforms ? selection.platforms : formValue.platforms;
        const useObjective = selection.customizeOverrides && selection.objective ? selection.objective : formValue.objective;

        const batch: TopicBatch = {
          id: batchId,
          brandId: isStandalone ? "" : brand!.id,
          standaloneNiche: isStandalone ? niche || undefined : undefined,
          themeId: selection.isAdhoc ? undefined : request.themeId,
          adhocThemeLabel: selection.isAdhoc ? request.themeLabel : undefined,
          name: formValue.name.trim() || t("topicGenerator.view.defaultBatchName", { count: request.requestedCount, theme: request.themeLabel }),
          requestedCount: request.requestedCount,
          generatedCount: 0,
          selectedCount: 0,
          targetAudience: formValue.targetAudience.trim() || undefined,
          objective: useObjective.trim() || undefined,
          platforms: usePlatforms,
          formats: useFormats,
          instructions: formValue.instructions.trim() || undefined,
          varietyLevel: formValue.varietyLevel,
          tone: formValue.tone,
          contentTypeDistribution: Object.fromEntries(request.distribution.map((entry) => [entry.contentType, entry.count])),
          status: "generated",
          groupId,
          createdAt: now,
          updatedAt: now,
        };
        addTopicBatch(batch);

        const lotSizes = splitIntoLotSizes(request.requestedCount, DEFAULT_LOT_SIZE);
        const lotDistributions = splitDistributionIntoLots(request.distribution, lotSizes);
        setLotsByBatch((prev) => ({
          ...prev,
          [batchId]: lotSizes.map((size, index) => ({ index, size, status: "pending" as const })),
        }));

        const shared: SharedGenerationParams = {
          items,
          niche,
          objective: useObjective.trim() || undefined,
          targetAudience: formValue.targetAudience.trim() || undefined,
          tone: formValue.tone,
          formats: useFormats,
          platforms: usePlatforms,
          instructions: [formValue.period.trim(), formValue.instructions.trim()].filter(Boolean).join(" — ") || undefined,
          varietyLevel: formValue.varietyLevel,
        };

        const seenLabels = new Set<string>();
        let addedForTheme = 0;
        let lastSource: "claude" | "simulated" = "simulated";
        for (let index = 0; index < lotSizes.length; index++) {
          const { added, source } = await runSingleLot(
            isStandalone ? "" : brand!.id,
            batchId,
            request,
            shared,
            0,
            index,
            lotSizes[index],
            lotDistributions[index],
            seenLabels
          );
          addedForTheme += added;
          lastSource = source;
          updateTopicBatch(batchId, { generatedCount: addedForTheme, source: lastSource, updatedAt: new Date().toISOString() });
        }
        totalGenerated += addedForTheme;
      }

      setRegenerationRounds({});
      setActiveGroupId(groupId);
      setSuccessMessage(t("topicGenerator.view.totalIdeasGenerated", { total: totalGenerated, count: requests.length }));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleToggleSelect(batchId: string, topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const nextSelected = !topic.selected;
    updateTopic(topicId, { selected: nextSelected });
    const selectedCount = batchTopics(batchId).filter((t) => (t.id === topicId ? nextSelected : t.selected)).length;
    updateTopicBatch(batchId, { selectedCount });
  }

  function handleToggleSelectAll(batchId: string) {
    const currentTopics = batchTopics(batchId);
    if (currentTopics.length === 0) return;
    const allSelected = currentTopics.every((t) => t.selected);
    const nextSelected = !allSelected;
    currentTopics.forEach((t) => updateTopic(t.id, { selected: nextSelected }));
    updateTopicBatch(batchId, { selectedCount: nextSelected ? currentTopics.length : 0 });
  }

  function handleToggleLock(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    updateTopic(topicId, { locked: !topic.locked });
  }

  function handleChangeLabel(topicId: string, label: string) {
    updateTopic(topicId, { label });
  }

  function handleDeleteTopic(batchId: string, topicId: string) {
    if (!window.confirm(t("topicGenerator.view.confirmDeleteTopic"))) return;
    const topic = topics.find((t) => t.id === topicId);
    removeTopic(topicId);
    if (topic?.selected) {
      const remainingSelected = batchTopics(batchId).filter((t) => t.id !== topicId && t.selected).length;
      updateTopicBatch(batchId, { selectedCount: remainingSelected });
    }
  }

  async function handleRegenerateUnlocked(batch: TopicBatch) {
    const isStandalone = !batch.brandId;
    const brand = isStandalone ? null : brands.find((b) => b.id === batch.brandId);
    if (!isStandalone && !brand) return;

    const currentTopics = batchTopics(batch.id);
    const unlocked = currentTopics.filter((t) => !t.locked);
    if (unlocked.length === 0) return;

    const round = (regenerationRounds[batch.id] ?? 0) + 1;
    const niche = nicheForBatch(batch);
    const items = isStandalone
      ? [niche || t("topicGenerator.view.genericTopicFallback")]
      : brand!.productsAndServices.length > 0
        ? brand!.productsAndServices
        : [brand!.name];
    const distribution: ContentTypeDistribution[] = Object.entries(
      unlocked.reduce<Partial<Record<string, number>>>((acc, t) => {
        const key = t.contentType ?? "advice";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([contentType, count]) => ({ contentType: contentType as ContentTypeDistribution["contentType"], count: count ?? 0 }));

    const themeLabel = themeLabelFor(batch);
    const request: ThemeGenerationRequest = {
      themeId: batch.themeId ?? batch.id,
      isAdhoc: !batch.themeId,
      themeLabel,
      requestedCount: unlocked.length,
      distribution,
    };

    setIsGenerating(true);
    try {
      const lotSizes = splitIntoLotSizes(unlocked.length, DEFAULT_LOT_SIZE);
      const lotDistributions = splitDistributionIntoLots(distribution, lotSizes);
      setLotsByBatch((prev) => ({
        ...prev,
        [batch.id]: lotSizes.map((size, index) => ({ index, size, status: "pending" as const })),
      }));

      const seenLabels = new Set(
        currentTopics.filter((t) => t.locked).map((t) => normalizeTopicLabel(t.label))
      );
      let cursor = 0;
      let totalReplaced = 0;
      let lastSource: "claude" | "simulated" = "simulated";
      for (let index = 0; index < lotSizes.length; index++) {
        const size = lotSizes[index];
        setLotsByBatch((prev) => patchLot(prev, batch.id, index, { status: "generating" }));
        const outcome = await generateTopicsLot(
          isStandalone ? "" : brand!.id,
          { ...request, requestedCount: size, distribution: lotDistributions[index] },
          {
            items,
            niche,
            objective: batch.objective,
            targetAudience: batch.targetAudience,
            tone: batch.tone,
            formats: batch.formats,
            platforms: batch.platforms,
            instructions: batch.instructions,
            varietyLevel: batch.varietyLevel,
          },
          round
        );

        if ("failure" in outcome) {
          setLotsByBatch((prev) => patchLot(prev, batch.id, index, { status: "error", errorMessage: outcome.failure.message }));
          cursor += size;
          continue;
        }

        const unique = outcome.result.topics.filter((generated) => {
          const key = normalizeTopicLabel(generated.label);
          if (key.length === 0 || seenLabels.has(key)) return false;
          seenLabels.add(key);
          return true;
        });
        unique.forEach((generated, offset) => {
          const target = unlocked[cursor + offset];
          if (!target) return;
          updateTopic(target.id, { label: generated.label, contentType: generated.contentType, angle: generated.angle, selected: false });
          totalReplaced += 1;
        });
        lastSource = outcome.result.source;
        setLotsByBatch((prev) => patchLot(prev, batch.id, index, { status: "success" }));
        cursor += size;
      }

      setRegenerationRounds((prev) => ({ ...prev, [batch.id]: round }));
      const remainingSelectedCount = currentTopics.filter((t) => t.locked && t.selected).length;
      updateTopicBatch(batch.id, {
        selectedCount: remainingSelectedCount,
        source: lastSource,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(t("topicGenerator.view.ideasRegenerated", { count: totalReplaced, theme: themeLabel }));
    } finally {
      setIsGenerating(false);
    }
  }

  function saveSelectedForBatch(batch: TopicBatch): number {
    const currentTopics = batchTopics(batch.id);
    // Ignore les sujets déjà enregistrés (topic.ideaId défini) — empêche les doublons si
    // l'utilisateur clique plusieurs fois sur « Ajouter à la Banque d'idées ».
    const selectedTopics = currentTopics.filter((t) => t.selected && !t.ideaId);
    if (selectedTopics.length === 0) return 0;

    const now = new Date().toISOString();
    selectedTopics.forEach((topic) => {
      const idea: Idea = {
        id: crypto.randomUUID(),
        brandId: batch.brandId,
        standaloneNiche: batch.brandId ? undefined : batch.standaloneNiche,
        themeId: batch.themeId,
        adhocThemeLabel: batch.themeId ? undefined : batch.adhocThemeLabel,
        batchId: batch.id,
        title: topic.label,
        source: "generated",
        status: "idea",
        platform: batch.platforms[0],
        format: batch.formats[0],
        objective: batch.objective,
        targetAudience: batch.targetAudience,
        contentType: topic.contentType,
        createdAt: now,
        updatedAt: now,
      };
      addIdea(idea);
      updateTopic(topic.id, { selected: false, ideaId: idea.id });
    });

    updateTopicBatch(batch.id, {
      selectedCount: 0,
      status: batch.status === "archived" ? batch.status : "partially_saved",
      updatedAt: now,
    });
    return selectedTopics.length;
  }

  // Le message ne promet jamais « Banque d'idées » : l'onglet de ce nom n'affiche aujourd'hui que
  // les notes libres (NotesView), pas ces idées — elles restent réelles et enregistrées (addIdea,
  // synchronisées), mais uniquement retrouvables en rouvrant ce lot de génération tant qu'aucune
  // liste dédiée ne les affiche ailleurs. Un message inexact ici se lirait comme une perte de
  // données pour l'utilisateur qui irait chercher dans cet onglet et n'y trouverait rien.
  function handleSaveSelected(batch: TopicBatch) {
    const count = saveSelectedForBatch(batch);
    if (count > 0) setSuccessMessage(t("topicGenerator.view.ideasSavedSingle", { count }));
  }

  function handleSaveAllSelected() {
    const total = activeGroupBatches.reduce((sum, batch) => sum + saveSelectedForBatch(batch), 0);
    if (total > 0) setSuccessMessage(t("topicGenerator.view.ideasSavedAll", { count: total }));
  }

  function handleArchiveBatch(batchId: string) {
    if (!window.confirm(t("topicGenerator.view.confirmArchiveBatch"))) return;
    archiveTopicBatch(batchId);
    setSuccessMessage(t("topicGenerator.view.batchArchived"));
  }

  function handleStartNew() {
    setActiveGroupId(null);
    setSuccessMessage(null);
    setFormErrors({});
  }

  function handleOpenGroup(groupId: string) {
    setActiveGroupId(groupId);
    setSuccessMessage(null);
    setDisplayMode("byTheme");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">{t("pageTitle.topicGenerator")}</h1>
        <p className="text-sm text-muted-foreground ">{t("topicGenerator.view.subtitle", { lotSize: DEFAULT_LOT_SIZE })}</p>
      </header>

      {successMessage && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      {activeGroupId ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStartNew}
              className="w-fit text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
            >
              ← {t("topicGenerator.view.newGeneration")}
            </button>
            {activeGroupBatches.length > 1 && (
              <div className="flex items-center gap-1 rounded-lg border border-border p-1 ">
                <button
                  type="button"
                  onClick={() => setDisplayMode("byTheme")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    displayMode === "byTheme" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "text-muted-foreground "
                  }`}
                >
                  {t("topicGenerator.view.byTheme")}
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode("all")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    displayMode === "all" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "text-muted-foreground "
                  }`}
                >
                  {t("topicGenerator.view.allIdeas")}
                </button>
              </div>
            )}
          </div>

          {displayMode === "all" && activeGroupBatches.length > 1 ? (
            <MixedTopicsView
              batches={activeGroupBatches}
              topicsByBatch={Object.fromEntries(activeGroupBatches.map((batch) => [batch.id, batchTopics(batch.id)]))}
              themeLabelFor={themeLabelFor}
              onToggleSelect={handleToggleSelect}
              onSaveAllSelected={handleSaveAllSelected}
            />
          ) : (
            activeGroupBatches.map((batch, index) => {
              const currentTopics = batchTopics(batch.id);
              const duplicates = detectDuplicateTopicIds(currentTopics);
              const existingMatches = detectExistingIdeaMatches(currentTopics, ideas);
              return (
                <TopicBatchResults
                  key={batch.id}
                  batch={batch}
                  topics={currentTopics}
                  themeLabel={themeLabelFor(batch)}
                  niche={nicheForBatch(batch)}
                  duplicates={duplicates}
                  existingIdeaMatches={existingMatches}
                  lots={lotsByBatch[batch.id]}
                  defaultExpanded={activeGroupBatches.length === 1 || index === 0}
                  onToggleSelect={(topicId) => handleToggleSelect(batch.id, topicId)}
                  onToggleSelectAll={() => handleToggleSelectAll(batch.id)}
                  onToggleLock={handleToggleLock}
                  onChangeLabel={handleChangeLabel}
                  onDeleteTopic={(topicId) => handleDeleteTopic(batch.id, topicId)}
                  onRegenerateUnlocked={() => void handleRegenerateUnlocked(batch)}
                  onGenerateMore={() => void handleGenerateMore(batch)}
                  onRetryLot={(lotIndex) => void handleRetryLot(batch, lotIndex)}
                  onSaveSelected={() => handleSaveSelected(batch)}
                  onArchiveBatch={() => handleArchiveBatch(batch.id)}
                  isBusy={isGenerating}
                />
              );
            })
          )}
        </div>
      ) : brands.length === 0 && !standaloneConfirmed ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16] ">
          <p className="text-base font-semibold text-foreground ">{t("topicGenerator.view.noBrandConfiguredTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground ">{t("topicGenerator.view.noBrandConfiguredHint")}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link
              href="/marques"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              {t("topicGenerator.view.configureBrand")}
            </Link>
            <button
              type="button"
              onClick={() => setStandaloneConfirmed(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {t("topicGenerator.view.continueWithoutBrand")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <TopicGeneratorForm
            value={formValue}
            onChange={handleFormChange}
            onGenerate={() => void handleGenerate()}
            isGenerating={isGenerating}
            themesForBrand={themesForBrand}
            niche={selectedBrand?.industry ?? ""}
            errors={formErrors}
          />
          <TopicBatchList batches={topicBatches} topics={topics} themeLabelFor={themeLabelFor} onOpen={handleOpenGroup} />
        </>
      )}
    </div>
  );
}
