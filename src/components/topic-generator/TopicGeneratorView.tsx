"use client";

import { useState } from "react";
import {
  TopicGeneratorForm,
  type TopicGeneratorFormErrors,
  type TopicGeneratorFormValue,
} from "@/components/topic-generator/TopicGeneratorForm";
import { TopicBatchList } from "@/components/topic-generator/TopicBatchList";
import { TopicBatchResults } from "@/components/topic-generator/TopicBatchResults";
import { brandProfiles } from "@/lib/brand-profiles";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { detectDuplicateTopicIds, generateTopicLabels } from "@/lib/topic-generator";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { Idea } from "@/types/idea";
import type { TopicBatch } from "@/types/topic-batch";

function buildInitialFormValue(): TopicGeneratorFormValue {
  const brand = brandProfiles[0];
  return {
    brandId: brand.id,
    themeId: "",
    name: "",
    requestedCount: 10,
    targetAudience: "",
    objective: "",
    platforms: brand.socialPlatforms,
    formats: ["text"],
    varietyLevel: "medium",
    instructions: "",
  };
}

function validateForm(value: TopicGeneratorFormValue): TopicGeneratorFormErrors {
  const errors: TopicGeneratorFormErrors = {};
  if (!value.themeId) errors.theme = "Choisissez une thématique.";
  if (!Number.isFinite(value.requestedCount) || value.requestedCount < 1 || value.requestedCount > 100) {
    errors.count = "Choisissez une quantité entre 1 et 100.";
  }
  if (value.platforms.length === 0) errors.platforms = "Sélectionnez au moins un réseau.";
  if (value.formats.length === 0) errors.formats = "Sélectionnez au moins un format.";
  return errors;
}

export function TopicGeneratorView() {
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

  const [formValue, setFormValue] = useState<TopicGeneratorFormValue>(buildInitialFormValue);
  const [formErrors, setFormErrors] = useState<TopicGeneratorFormErrors>({});
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [regenerationRounds, setRegenerationRounds] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const themesForBrand = getActiveThemesForBrand(themes, formValue.brandId);
  const activeBatch = topicBatches.find((batch) => batch.id === activeBatchId) ?? null;
  const activeBatchTopics = topics.filter((topic) => topic.batchId === activeBatchId);
  const activeThemeLabel =
    themes.find((theme) => theme.id === activeBatch?.themeId)?.label ?? "Sans thématique";
  const duplicates = detectDuplicateTopicIds(activeBatchTopics);

  function themeLabelFor(batch: TopicBatch): string {
    return themes.find((theme) => theme.id === batch.themeId)?.label ?? "Sans thématique";
  }

  function handleFormChange(next: TopicGeneratorFormValue) {
    if (next.brandId !== formValue.brandId) {
      const brand = brandProfiles.find((b) => b.id === next.brandId);
      setFormValue({ ...next, platforms: brand?.socialPlatforms ?? [] });
    } else {
      setFormValue(next);
    }
  }

  function handleGenerate() {
    const errors = validateForm(formValue);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const brand = brandProfiles.find((b) => b.id === formValue.brandId);
    const theme = themes.find((t) => t.id === formValue.themeId);
    if (!brand || !theme) return;

    const now = new Date().toISOString();
    const items = brand.productsAndServices.length > 0 ? brand.productsAndServices : [brand.name];
    const labels = generateTopicLabels(
      {
        themeLabel: theme.label,
        items,
        objective: formValue.objective.trim() || undefined,
        targetAudience: formValue.targetAudience.trim() || undefined,
        varietyLevel: formValue.varietyLevel,
      },
      formValue.requestedCount
    );

    const batchId = crypto.randomUUID();
    const batch: TopicBatch = {
      id: batchId,
      brandId: brand.id,
      themeId: theme.id,
      name: formValue.name.trim() || `${formValue.requestedCount} sujets — ${theme.label}`,
      requestedCount: formValue.requestedCount,
      generatedCount: labels.length,
      selectedCount: 0,
      targetAudience: formValue.targetAudience.trim() || undefined,
      objective: formValue.objective.trim() || undefined,
      platforms: formValue.platforms,
      formats: formValue.formats,
      instructions: formValue.instructions.trim() || undefined,
      varietyLevel: formValue.varietyLevel,
      status: "generated",
      createdAt: now,
      updatedAt: now,
    };
    addTopicBatch(batch);
    labels.forEach((label) => {
      addTopic({ id: crypto.randomUUID(), batchId, label, selected: false, locked: false });
    });

    setRegenerationRounds((prev) => ({ ...prev, [batchId]: 0 }));
    setActiveBatchId(batchId);
    setSuccessMessage(`${labels.length} sujet(s) généré(s).`);
  }

  function handleToggleSelect(topicId: string) {
    if (!activeBatchId) return;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const nextSelected = !topic.selected;
    updateTopic(topicId, { selected: nextSelected });
    const selectedCount = activeBatchTopics.filter((t) =>
      t.id === topicId ? nextSelected : t.selected
    ).length;
    updateTopicBatch(activeBatchId, { selectedCount });
  }

  function handleToggleSelectAll() {
    if (!activeBatchId || activeBatchTopics.length === 0) return;
    const allSelected = activeBatchTopics.every((t) => t.selected);
    const nextSelected = !allSelected;
    activeBatchTopics.forEach((t) => updateTopic(t.id, { selected: nextSelected }));
    updateTopicBatch(activeBatchId, { selectedCount: nextSelected ? activeBatchTopics.length : 0 });
  }

  function handleToggleLock(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    updateTopic(topicId, { locked: !topic.locked });
  }

  function handleChangeLabel(topicId: string, label: string) {
    updateTopic(topicId, { label });
  }

  function handleDeleteTopic(topicId: string) {
    if (!window.confirm("Supprimer définitivement ce sujet ?")) return;
    const topic = topics.find((t) => t.id === topicId);
    removeTopic(topicId);
    if (topic?.selected && activeBatchId) {
      const remainingSelected = activeBatchTopics.filter(
        (t) => t.id !== topicId && t.selected
      ).length;
      updateTopicBatch(activeBatchId, { selectedCount: remainingSelected });
    }
  }

  function handleRegenerateUnlocked() {
    if (!activeBatchId || !activeBatch) return;
    const brand = brandProfiles.find((b) => b.id === activeBatch.brandId);
    const theme = themes.find((t) => t.id === activeBatch.themeId);
    if (!brand || !theme) return;

    const unlocked = activeBatchTopics.filter((t) => !t.locked);
    if (unlocked.length === 0) return;

    const round = (regenerationRounds[activeBatchId] ?? 0) + 1;
    const items = brand.productsAndServices.length > 0 ? brand.productsAndServices : [brand.name];
    const labels = generateTopicLabels(
      {
        themeLabel: theme.label,
        items,
        objective: activeBatch.objective,
        targetAudience: activeBatch.targetAudience,
        varietyLevel: activeBatch.varietyLevel,
      },
      unlocked.length,
      round
    );

    unlocked.forEach((topic, index) => {
      updateTopic(topic.id, { label: labels[index], selected: false });
    });

    setRegenerationRounds((prev) => ({ ...prev, [activeBatchId]: round }));
    const remainingSelectedCount = activeBatchTopics.filter((t) => t.locked && t.selected).length;
    updateTopicBatch(activeBatchId, {
      selectedCount: remainingSelectedCount,
      updatedAt: new Date().toISOString(),
    });
    setSuccessMessage(`${unlocked.length} sujet(s) régénéré(s).`);
  }

  function handleSaveSelected() {
    if (!activeBatchId || !activeBatch) return;
    const selectedTopics = activeBatchTopics.filter((t) => t.selected);
    if (selectedTopics.length === 0) return;

    const now = new Date().toISOString();
    selectedTopics.forEach((topic) => {
      const idea: Idea = {
        id: crypto.randomUUID(),
        brandId: activeBatch.brandId,
        themeId: activeBatch.themeId,
        batchId: activeBatch.id,
        title: topic.label,
        source: "generated",
        status: "idea",
        platform: activeBatch.platforms[0],
        format: activeBatch.formats[0],
        objective: activeBatch.objective,
        targetAudience: activeBatch.targetAudience,
        createdAt: now,
        updatedAt: now,
      };
      addIdea(idea);
      updateTopic(topic.id, { selected: false, ideaId: idea.id });
    });

    updateTopicBatch(activeBatchId, {
      selectedCount: 0,
      status: activeBatch.status === "archived" ? activeBatch.status : "partially_saved",
      updatedAt: now,
    });
    setSuccessMessage(`${selectedTopics.length} sujet(s) enregistré(s) dans la banque d'idées.`);
  }

  function handleArchiveBatch() {
    if (!activeBatchId) return;
    if (!window.confirm("Archiver ce bloc de sujets ?")) return;
    archiveTopicBatch(activeBatchId);
    setSuccessMessage("Bloc archivé.");
    setActiveBatchId(null);
  }

  function handleStartNew() {
    setActiveBatchId(null);
    setSuccessMessage(null);
    setFormErrors({});
  }

  function handleOpenBatch(batchId: string) {
    setActiveBatchId(batchId);
    setSuccessMessage(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          Générateur de sujets
        </h1>
        <p className="text-sm text-muted-foreground ">
          Génère un bloc de sujets distincts pour une thématique donnée, en mode démonstration —
          pas encore des contenus complets.
        </p>
      </header>

      {successMessage && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      {activeBatch ? (
        <TopicBatchResults
          batch={activeBatch}
          topics={activeBatchTopics}
          themeLabel={activeThemeLabel}
          duplicates={duplicates}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleLock={handleToggleLock}
          onChangeLabel={handleChangeLabel}
          onDeleteTopic={handleDeleteTopic}
          onRegenerateUnlocked={handleRegenerateUnlocked}
          onSaveSelected={handleSaveSelected}
          onArchiveBatch={handleArchiveBatch}
          onStartNew={handleStartNew}
        />
      ) : (
        <>
          <TopicGeneratorForm
            value={formValue}
            onChange={handleFormChange}
            onGenerate={handleGenerate}
            themesForBrand={themesForBrand}
            errors={formErrors}
          />
          <TopicBatchList batches={topicBatches} themeLabelFor={themeLabelFor} onOpen={handleOpenBatch} />
        </>
      )}
    </div>
  );
}
