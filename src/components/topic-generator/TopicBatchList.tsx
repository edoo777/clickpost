"use client";

import { brandProfiles } from "@/lib/brand-profiles";
import type { TopicBatch } from "@/types/topic-batch";

interface TopicBatchListProps {
  batches: TopicBatch[];
  themeLabelFor: (batch: TopicBatch) => string;
  onOpen: (batchId: string) => void;
}

export function TopicBatchList({ batches, themeLabelFor, onOpen }: TopicBatchListProps) {
  if (batches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/[.12] px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
        Aucun bloc de sujets généré pour l&apos;instant. Choisissez une marque, une thématique et une
        quantité ci-dessus pour commencer.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Blocs précédents</h2>
      {batches.map((batch) => {
        const brand = brandProfiles.find((b) => b.id === batch.brandId);
        return (
          <button
            key={batch.id}
            type="button"
            onClick={() => onOpen(batch.id)}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/[.08] bg-white px-4 py-3 text-left hover:border-black/[.16] dark:border-white/[.08] dark:bg-zinc-950 dark:hover:border-white/[.16]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{batch.name}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {brand?.name ?? batch.brandId} · {themeLabelFor(batch)}
              </span>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              {batch.selectedCount}/{batch.generatedCount} sélectionnés ·{" "}
              {batch.status === "archived" ? "Archivé" : "Actif"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
