"use client";

import { useBrandsSession } from "@/lib/brands-store";
import type { TopicBatch } from "@/types/topic-batch";

interface TopicBatchListProps {
  batches: TopicBatch[];
  themeLabelFor: (batch: TopicBatch) => string;
  onOpen: (batchId: string) => void;
}

export function TopicBatchList({ batches, themeLabelFor, onOpen }: TopicBatchListProps) {
  const { brands } = useBrandsSession();

  if (batches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
        Aucun bloc de sujets généré pour l&apos;instant. Choisissez une marque, une thématique et une
        quantité ci-dessus pour commencer.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-foreground ">Blocs précédents</h2>
      {batches.map((batch) => {
        const brand = brands.find((b) => b.id === batch.brandId);
        return (
          <button
            key={batch.id}
            type="button"
            onClick={() => onOpen(batch.id)}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-zinc-400   dark:hover:border-white/[.16]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{batch.name}</span>
              <span className="text-xs text-muted-foreground ">
                {brand?.name ?? batch.brandId} · {themeLabelFor(batch)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground ">
              {batch.selectedCount}/{batch.generatedCount} sélectionnés ·{" "}
              {batch.status === "archived" ? "Archivé" : "Actif"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
