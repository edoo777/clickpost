"use client";

import { useState } from "react";
import { TopicRow } from "@/components/topic-generator/TopicRow";
import { CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { MAX_REQUESTED_PER_THEME, type LotStatus } from "@/lib/topic-generator";
import type { Topic, TopicBatch } from "@/types/topic-batch";

interface TopicBatchResultsProps {
  batch: TopicBatch;
  topics: Topic[];
  themeLabel: string;
  niche: string;
  duplicates: Record<string, string>;
  /** Sujet → id d'une idée déjà existante dans le workspace au libellé équivalent — signalé,
   * jamais supprimé automatiquement. */
  existingIdeaMatches: Record<string, string>;
  /** Progression par lot de la génération en cours — absent une fois la génération terminée. */
  lots?: LotStatus[];
  onRetryLot?: (lotIndex: number) => void;
  /** Désactive les actions qui déclencheraient un nouvel appel IA pendant qu'une génération est
   * déjà en cours ailleurs — évite les appels concurrents non désirés. */
  isBusy?: boolean;
  /** Replié par défaut à l'ouverture — « Voir les idées » affiche la liste complète. */
  defaultExpanded?: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleLock: (id: string) => void;
  onChangeLabel: (id: string, label: string) => void;
  onDeleteTopic: (id: string) => void;
  onRegenerateUnlocked: () => void;
  onGenerateMore: () => void;
  onSaveSelected: () => void;
  onArchiveBatch: () => void;
}

const GENERATION_STATE_LABEL: Record<NonNullable<TopicBatch["source"]>, string> = {
  claude: "Généré par Claude",
  simulated: "Généré en mode démonstration",
};

const LOT_STATUS_LABEL: Record<LotStatus["status"], string> = {
  pending: "En attente",
  generating: "Génération…",
  success: "Terminé",
  error: "Erreur",
};

const LOT_STATUS_CLASS: Record<LotStatus["status"], string> = {
  pending: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  generating: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  error: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export function TopicBatchResults({
  batch,
  topics,
  themeLabel,
  niche,
  duplicates,
  existingIdeaMatches,
  lots,
  onRetryLot,
  isBusy,
  defaultExpanded = false,
  onToggleSelect,
  onToggleSelectAll,
  onToggleLock,
  onChangeLabel,
  onDeleteTopic,
  onRegenerateUnlocked,
  onGenerateMore,
  onSaveSelected,
  onArchiveBatch,
}: TopicBatchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const selectedCount = topics.filter((topic) => topic.selected).length;
  const allSelected = topics.length > 0 && selectedCount === topics.length;
  const unlockedCount = topics.filter((topic) => !topic.locked).length;
  const contentTypesUsed = Array.from(
    new Set(topics.map((topic) => topic.contentType).filter((value): value is ContentType => Boolean(value)))
  );
  const hasErrorLot = (lots ?? []).some((lot) => lot.status === "error");
  const isLotsInProgress = (lots ?? []).some((lot) => lot.status === "pending" || lot.status === "generating");

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground ">{themeLabel}</h2>
          <p className="text-xs text-muted-foreground ">Niche : {niche || "non précisée"}</p>
          <p className="text-sm text-muted-foreground ">{batch.name}</p>
          {contentTypesUsed.length > 0 && (
            <p className="text-xs text-muted-foreground ">
              Types de contenu : {contentTypesUsed.map((type) => CONTENT_TYPE_LABEL[type]).join(", ")}
            </p>
          )}
          {batch.source && (
            <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ">
              {GENERATION_STATE_LABEL[batch.source]}
            </span>
          )}
        </div>
        <dl className="flex flex-wrap gap-4 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground ">Demandées</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{batch.requestedCount}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground ">Générées</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{topics.length}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-muted-foreground ">Sélectionnées</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCount}</dd>
          </div>
        </dl>
      </div>

      {lots && lots.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {lots.map((lot) => (
            <span key={lot.index} className="flex items-center gap-1">
              <span
                title={lot.errorMessage}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LOT_STATUS_CLASS[lot.status]}`}
              >
                Lot {lot.index + 1}/{lots.length} ({lot.size}) · {LOT_STATUS_LABEL[lot.status]}
              </span>
              {lot.status === "error" && onRetryLot && (
                <button
                  type="button"
                  onClick={() => onRetryLot(lot.index)}
                  disabled={isBusy}
                  className="text-[11px] font-medium text-violet-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-400"
                >
                  Reprendre
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {hasErrorLot && !isLotsInProgress && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Un ou plusieurs lots n&apos;ont pas pu être générés — les idées déjà reçues sont conservées, utilisez « Reprendre » sur le lot en erreur.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {isExpanded ? "Masquer les idées" : "Voir les idées"}
        </button>
        <button
          type="button"
          onClick={onRegenerateUnlocked}
          disabled={unlockedCount === 0 || isBusy}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Régénérer
        </button>
        <button
          type="button"
          onClick={onGenerateMore}
          disabled={isBusy || topics.length >= MAX_REQUESTED_PER_THEME}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Générer plus
        </button>
        <button
          type="button"
          onClick={onSaveSelected}
          disabled={selectedCount === 0}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
        >
          Ajouter à la Banque d&apos;idées ({selectedCount})
        </button>
        <button
          type="button"
          onClick={onArchiveBatch}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Archiver le bloc
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="w-fit text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
          {topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              batch={batch}
              isDuplicate={Boolean(duplicates[topic.id])}
              isExistingInBank={Boolean(existingIdeaMatches[topic.id])}
              onToggleSelect={() => onToggleSelect(topic.id)}
              onToggleLock={() => onToggleLock(topic.id)}
              onChangeLabel={(label) => onChangeLabel(topic.id, label)}
              onDelete={() => onDeleteTopic(topic.id)}
            />
          ))}
          {topics.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
              {isLotsInProgress ? "Génération en cours…" : "Tous les sujets de ce bloc ont été supprimés."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
