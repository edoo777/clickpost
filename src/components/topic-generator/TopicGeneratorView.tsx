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
import { resolvedDistributionTotal } from "@/components/topic-generator/ThemeSelectionPanel";
import { buildBalancedDistribution, type ContentTypeDistribution } from "@/lib/content-types";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { detectDuplicateTopicIds, generateTopicsForThemes, type ThemeGenerationRequest } from "@/lib/topic-generator";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { Brand } from "@/types/brand";
import type { Idea } from "@/types/idea";
import type { Topic, TopicBatch } from "@/types/topic-batch";

function buildInitialFormValue(brand: Brand | undefined): TopicGeneratorFormValue {
  return {
    brandId: brand?.id ?? "",
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

function validateForm(value: TopicGeneratorFormValue): TopicGeneratorFormErrors {
  const errors: TopicGeneratorFormErrors = {};
  if (value.themeSelections.length === 0) errors.themes = "Sélectionnez au moins une thématique.";
  for (const selection of value.themeSelections) {
    if (!Number.isFinite(selection.requestedCount) || selection.requestedCount < 1 || selection.requestedCount > 100) {
      errors.themes = "Chaque thématique doit demander entre 1 et 100 idées.";
    }
    if (selection.distributionMode === "custom" && resolvedDistributionTotal(selection) !== selection.requestedCount) {
      errors.themes = "La répartition personnalisée doit correspondre exactement au nombre d'idées demandé pour chaque thématique.";
    }
  }
  if (value.platforms.length === 0) errors.platforms = "Sélectionnez au moins un réseau.";
  if (value.formats.length === 0) errors.formats = "Sélectionnez au moins un format.";
  return errors;
}

export function TopicGeneratorView() {
  const { brands, activeBrandId } = useBrandsSession();
  const { themes } = useThemesSession();
  const {
    topicBatches,
    topics,
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

  const selectedBrand = brands.find((brand) => brand.id === formValue.brandId);
  const themesForBrand = getActiveThemesForBrand(themes, formValue.brandId);
  const activeGroupBatches = activeGroupId
    ? topicBatches.filter((batch) => (batch.groupId ?? batch.id) === activeGroupId)
    : [];

  function themeLabelFor(batch: TopicBatch): string {
    return themes.find((theme) => theme.id === batch.themeId)?.label ?? "Sans thématique";
  }

  function nicheForBrandId(brandId: string): string {
    return brands.find((brand) => brand.id === brandId)?.industry ?? "";
  }

  function handleFormChange(next: TopicGeneratorFormValue) {
    if (next.brandId !== formValue.brandId) {
      setFormValue({ ...next, platforms: [] });
    } else {
      setFormValue(next);
    }
  }

  async function handleGenerate() {
    const errors = validateForm(formValue);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const brand = brands.find((b) => b.id === formValue.brandId);
    if (!brand) return;

    const themeRequests: ThemeGenerationRequest[] = formValue.themeSelections
      .map((selection) => {
        const theme = themesForBrand.find((candidate) => candidate.id === selection.themeId);
        if (!theme) return null;
        return {
          themeId: theme.id,
          themeLabel: theme.label,
          requestedCount: selection.requestedCount,
          distribution: distributionFor(selection),
        };
      })
      .filter((request): request is ThemeGenerationRequest => request !== null);
    if (themeRequests.length === 0) return;

    setIsGenerating(true);
    try {
      const items = brand.productsAndServices.length > 0 ? brand.productsAndServices : [brand.name];
      const results = await generateTopicsForThemes(
        brand.id,
        themeRequests,
        {
          items,
          niche: brand.industry,
          objective: formValue.objective.trim() || undefined,
          targetAudience: formValue.targetAudience.trim() || undefined,
          tone: formValue.tone,
          formats: formValue.formats,
          platforms: formValue.platforms,
          instructions: [formValue.period.trim(), formValue.instructions.trim()].filter(Boolean).join(" — ") || undefined,
          varietyLevel: formValue.varietyLevel,
        },
        0
      );

      const groupId = crypto.randomUUID();
      const now = new Date().toISOString();
      let totalGenerated = 0;
      let anyFallback = false;

      for (const request of themeRequests) {
        const result = results.find((candidate) => candidate.themeId === request.themeId);
        if (!result) continue;
        if (result.source === "simulated" && result.fallbackReason) anyFallback = true;

        const batchId = crypto.randomUUID();
        const batch: TopicBatch = {
          id: batchId,
          brandId: brand.id,
          themeId: request.themeId,
          name: formValue.name.trim() || `${request.requestedCount} idées — ${request.themeLabel}`,
          requestedCount: request.requestedCount,
          generatedCount: result.topics.length,
          selectedCount: 0,
          targetAudience: formValue.targetAudience.trim() || undefined,
          objective: formValue.objective.trim() || undefined,
          platforms: formValue.platforms,
          formats: formValue.formats,
          instructions: formValue.instructions.trim() || undefined,
          varietyLevel: formValue.varietyLevel,
          tone: formValue.tone,
          status: "generated",
          groupId,
          source: result.source,
          createdAt: now,
          updatedAt: now,
        };
        addTopicBatch(batch);
        result.topics.forEach((generated) => {
          addTopic({
            id: crypto.randomUUID(),
            batchId,
            label: generated.label,
            selected: false,
            locked: false,
            contentType: generated.contentType,
          });
        });
        totalGenerated += result.topics.length;
      }

      setRegenerationRounds({});
      setActiveGroupId(groupId);
      setSuccessMessage(
        `${totalGenerated} idée(s) générée(s) sur ${themeRequests.length} thématique(s)${
          anyFallback ? " — IA réelle indisponible pour au moins une thématique, résultat simulé utilisé." : ""
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function batchTopics(batchId: string): Topic[] {
    return topics.filter((topic) => topic.batchId === batchId);
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
    if (!window.confirm("Supprimer définitivement ce sujet ?")) return;
    const topic = topics.find((t) => t.id === topicId);
    removeTopic(topicId);
    if (topic?.selected) {
      const remainingSelected = batchTopics(batchId).filter((t) => t.id !== topicId && t.selected).length;
      updateTopicBatch(batchId, { selectedCount: remainingSelected });
    }
  }

  async function handleRegenerateUnlocked(batch: TopicBatch) {
    const brand = brands.find((b) => b.id === batch.brandId);
    const theme = themes.find((t) => t.id === batch.themeId);
    if (!brand || !theme) return;

    const currentTopics = batchTopics(batch.id);
    const unlocked = currentTopics.filter((t) => !t.locked);
    if (unlocked.length === 0) return;

    const round = (regenerationRounds[batch.id] ?? 0) + 1;
    const items = brand.productsAndServices.length > 0 ? brand.productsAndServices : [brand.name];
    const distribution: ContentTypeDistribution[] = Object.entries(
      unlocked.reduce<Partial<Record<string, number>>>((acc, t) => {
        const key = t.contentType ?? "advice";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([contentType, count]) => ({ contentType: contentType as ContentTypeDistribution["contentType"], count: count ?? 0 }));

    setIsGenerating(true);
    try {
      const [result] = await generateTopicsForThemes(
        brand.id,
        [{ themeId: theme.id, themeLabel: theme.label, requestedCount: unlocked.length, distribution }],
        {
          items,
          niche: brand.industry,
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

      unlocked.forEach((topic, index) => {
        const generated = result.topics[index];
        if (!generated) return;
        updateTopic(topic.id, { label: generated.label, contentType: generated.contentType, selected: false });
      });

      setRegenerationRounds((prev) => ({ ...prev, [batch.id]: round }));
      const remainingSelectedCount = currentTopics.filter((t) => t.locked && t.selected).length;
      updateTopicBatch(batch.id, {
        selectedCount: remainingSelectedCount,
        source: result.source,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(`${unlocked.length} idée(s) régénérée(s) pour « ${theme.label} ».`);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSaveSelected(batch: TopicBatch) {
    const currentTopics = batchTopics(batch.id);
    const selectedTopics = currentTopics.filter((t) => t.selected);
    if (selectedTopics.length === 0) return;

    const now = new Date().toISOString();
    selectedTopics.forEach((topic) => {
      const idea: Idea = {
        id: crypto.randomUUID(),
        brandId: batch.brandId,
        themeId: batch.themeId,
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
    setSuccessMessage(`${selectedTopics.length} idée(s) enregistrée(s) dans la Banque d'idées.`);
  }

  function handleArchiveBatch(batchId: string) {
    if (!window.confirm("Archiver ce bloc ?")) return;
    archiveTopicBatch(batchId);
    setSuccessMessage("Bloc archivé.");
  }

  function handleStartNew() {
    setActiveGroupId(null);
    setSuccessMessage(null);
    setFormErrors({});
  }

  function handleOpenGroup(groupId: string) {
    setActiveGroupId(groupId);
    setSuccessMessage(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">Générateur d&apos;idées</h1>
        <p className="text-sm text-muted-foreground ">
          Génère un ou plusieurs blocs d&apos;idées, un par thématique, avec leur propre répartition de
          types de contenu.
        </p>
      </header>

      {successMessage && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      {activeGroupId ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleStartNew}
            className="w-fit text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
          >
            ← Nouvelle génération
          </button>
          {activeGroupBatches.map((batch, index) => {
            const currentTopics = batchTopics(batch.id);
            const duplicates = detectDuplicateTopicIds(currentTopics);
            return (
              <TopicBatchResults
                key={batch.id}
                batch={batch}
                topics={currentTopics}
                themeLabel={themeLabelFor(batch)}
                niche={nicheForBrandId(batch.brandId)}
                duplicates={duplicates}
                defaultExpanded={activeGroupBatches.length === 1 || index === 0}
                onToggleSelect={(topicId) => handleToggleSelect(batch.id, topicId)}
                onToggleSelectAll={() => handleToggleSelectAll(batch.id)}
                onToggleLock={handleToggleLock}
                onChangeLabel={handleChangeLabel}
                onDeleteTopic={(topicId) => handleDeleteTopic(batch.id, topicId)}
                onRegenerateUnlocked={() => void handleRegenerateUnlocked(batch)}
                onSaveSelected={() => handleSaveSelected(batch)}
                onArchiveBatch={() => handleArchiveBatch(batch.id)}
              />
            );
          })}
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16] ">
          <p className="text-base font-semibold text-foreground ">Aucune marque configurée</p>
          <p className="max-w-sm text-sm text-muted-foreground ">
            Le Générateur d&apos;idées a besoin d&apos;une marque (niche, comptes affiliés,
            thématiques) pour produire du contenu pertinent.
          </p>
          <Link
            href="/marques"
            className="mt-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            Configurer une marque
          </Link>
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
          <TopicBatchList batches={topicBatches} themeLabelFor={themeLabelFor} onOpen={handleOpenGroup} />
        </>
      )}
    </div>
  );
}
