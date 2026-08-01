"use client";

import { useBrandsSession } from "@/lib/brands-store";
import type { TopicBatch } from "@/types/topic-batch";

interface TopicBatchListProps {
  batches: TopicBatch[];
  themeLabelFor: (batch: TopicBatch) => string;
  /** Ouvre le groupe entier (toutes les thématiques générées ensemble) auquel appartient ce bloc. */
  onOpen: (groupId: string) => void;
}

export function TopicBatchList({ batches, themeLabelFor, onOpen }: TopicBatchListProps) {
  const { brands } = useBrandsSession();

  if (batches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
        Aucun bloc de sujets généré pour l&apos;instant. Choisissez une marque, une ou plusieurs
        thématiques et une quantité ci-dessus pour commencer.
      </p>
    );
  }

  // Un groupe = une génération multi-thématiques ; les blocs sans groupId (antérieurs à cette
  // fonctionnalité) restent affichés individuellement, chacun formant son propre groupe.
  const groups = new Map<string, TopicBatch[]>();
  for (const batch of batches) {
    const key = batch.groupId ?? batch.id;
    const existing = groups.get(key) ?? [];
    existing.push(batch);
    groups.set(key, existing);
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-foreground ">Générations précédentes</h2>
      {Array.from(groups.entries()).map(([groupId, groupBatches]) => {
        const first = groupBatches[0];
        const brand = brands.find((b) => b.id === first.brandId);
        const totalGenerated = groupBatches.reduce((sum, batch) => sum + batch.generatedCount, 0);
        const totalSelected = groupBatches.reduce((sum, batch) => sum + batch.selectedCount, 0);
        const allArchived = groupBatches.every((batch) => batch.status === "archived");
        return (
          <button
            key={groupId}
            type="button"
            onClick={() => onOpen(groupId)}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-zinc-400   dark:hover:border-white/[.16]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {brand?.name ?? first.brandId}
              </span>
              <span className="text-xs text-muted-foreground ">
                {groupBatches.map((batch) => themeLabelFor(batch)).join(" · ")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground ">
              {totalSelected}/{totalGenerated} sélectionnées · {allArchived ? "Archivé" : "Actif"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
