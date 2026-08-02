"use client";

import { useMemo, useState } from "react";
import type { Topic, TopicBatch } from "@/types/topic-batch";

interface MixedTopicsViewProps {
  batches: TopicBatch[];
  topicsByBatch: Record<string, Topic[]>;
  themeLabelFor: (batch: TopicBatch) => string;
  onToggleSelect: (batchId: string, topicId: string) => void;
  onSaveAllSelected: () => void;
}

/**
 * Vue « Toutes les idées » — mélange facultatif des sujets de plusieurs thématiques d'une même
 * génération, sans jamais effacer leur thématique d'origine (toujours affichée en étiquette,
 * toujours utilisée telle quelle lors de l'ajout à la Banque d'idées). Purement une vue
 * d'affichage : aucune donnée déplacée, les Topic restent rattachés à leur TopicBatch d'origine.
 */
export function MixedTopicsView({ batches, topicsByBatch, themeLabelFor, onToggleSelect, onSaveAllSelected }: MixedTopicsViewProps) {
  const [includedBatchIds, setIncludedBatchIds] = useState<Set<string>>(() => new Set(batches.map((batch) => batch.id)));

  function toggleBatch(batchId: string) {
    setIncludedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  const rows = useMemo(() => {
    return batches
      .filter((batch) => includedBatchIds.has(batch.id))
      .flatMap((batch) => (topicsByBatch[batch.id] ?? []).map((topic) => ({ batch, topic })));
  }, [batches, topicsByBatch, includedBatchIds]);

  const selectedCount = rows.filter((row) => row.topic.selected).length;

  function selectAll(selected: boolean) {
    rows.forEach(({ batch, topic }) => {
      if (topic.selected !== selected) onToggleSelect(batch.id, topic.id);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {batches.map((batch) => (
            <button
              key={batch.id}
              type="button"
              onClick={() => toggleBatch(batch.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                includedBatchIds.has(batch.id)
                  ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  : "border-border text-zinc-600  dark:text-zinc-400"
              }`}
            >
              {themeLabelFor(batch)}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ">
          {rows.length} idée{rows.length > 1 ? "s" : ""} · {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => selectAll(true)} className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400">
          Tout sélectionner
        </button>
        <button type="button" onClick={() => selectAll(false)} className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400">
          Tout désélectionner
        </button>
        <button
          type="button"
          onClick={onSaveAllSelected}
          disabled={selectedCount === 0}
          className="ml-auto rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
        >
          Ajouter la sélection à la Banque d&apos;idées ({selectedCount})
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map(({ batch, topic }) => (
          <label
            key={topic.id}
            className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <input type="checkbox" checked={topic.selected} onChange={() => onToggleSelect(batch.id, topic.id)} />
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ">
              {themeLabelFor(batch)}
            </span>
            <span className="flex-1 truncate">{topic.label}</span>
          </label>
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
            Sélectionnez au moins une thématique ci-dessus pour afficher ses idées.
          </p>
        )}
      </div>
    </div>
  );
}
