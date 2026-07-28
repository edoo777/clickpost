"use client";

import { TopicRow } from "@/components/topic-generator/TopicRow";
import type { Topic, TopicBatch } from "@/types/topic-batch";

interface TopicBatchResultsProps {
  batch: TopicBatch;
  topics: Topic[];
  themeLabel: string;
  duplicates: Record<string, string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleLock: (id: string) => void;
  onChangeLabel: (id: string, label: string) => void;
  onDeleteTopic: (id: string) => void;
  onRegenerateUnlocked: () => void;
  onSaveSelected: () => void;
  onArchiveBatch: () => void;
  onStartNew: () => void;
}

export function TopicBatchResults({
  batch,
  topics,
  themeLabel,
  duplicates,
  onToggleSelect,
  onToggleSelectAll,
  onToggleLock,
  onChangeLabel,
  onDeleteTopic,
  onRegenerateUnlocked,
  onSaveSelected,
  onArchiveBatch,
  onStartNew,
}: TopicBatchResultsProps) {
  const selectedCount = topics.filter((topic) => topic.selected).length;
  const allSelected = topics.length > 0 && selectedCount === topics.length;
  const unlockedCount = topics.filter((topic) => !topic.locked).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5  ">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground ">{batch.name}</h2>
          <p className="text-sm text-muted-foreground ">{themeLabel}</p>
        </div>
        <dl className="flex flex-wrap gap-4 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground ">Demandés</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{batch.requestedCount}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground ">Générés</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{batch.generatedCount}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground ">Sélectionnés</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCount}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
        <button
          type="button"
          onClick={onRegenerateUnlocked}
          disabled={unlockedCount === 0}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Régénérer les non verrouillés
        </button>
        <button
          type="button"
          onClick={onSaveSelected}
          disabled={selectedCount === 0}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
        >
          Enregistrer la sélection ({selectedCount})
        </button>
        <button
          type="button"
          onClick={onArchiveBatch}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Archiver le bloc
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
        >
          Nouvelle génération
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {topics.map((topic) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            isDuplicate={Boolean(duplicates[topic.id])}
            onToggleSelect={() => onToggleSelect(topic.id)}
            onToggleLock={() => onToggleLock(topic.id)}
            onChangeLabel={(label) => onChangeLabel(topic.id, label)}
            onDelete={() => onDeleteTopic(topic.id)}
          />
        ))}
        {topics.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
            Tous les sujets de ce bloc ont été supprimés.
          </p>
        )}
      </div>
    </div>
  );
}
