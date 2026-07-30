"use client";

import { useMemo, useState } from "react";
import { ConflictFieldDiff } from "@/components/conflicts/ConflictFieldDiff";
import { IconClose } from "@/components/icons";
import { useBrandsSession } from "@/lib/brands-store";
import {
  CONFLICT_ENTITY_LABEL,
  buildConflictFieldRows,
  formatDateTime,
  getConflictTitle,
} from "@/lib/conflict-display";
import { useConflictsSession } from "@/lib/conflicts-store";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { ConflictEntry, ConflictResolutionChoice } from "@/types/conflict";

interface ConflictComparisonPanelProps {
  entry: ConflictEntry;
  onClose: () => void;
}

type Stage = "choose" | "merge";

/**
 * Comparaison côte à côte et résolution d'un conflit (F1.7). Ne décide jamais seule : chaque
 * action est un choix explicite de l'utilisateur, avec aperçu avant confirmation pour la
 * fusion manuelle, et re-vérification de la fraîcheur distante à la confirmation (voir
 * `resolveConflict` dans conflict-resolution.ts).
 */
export function ConflictComparisonPanel({ entry: initialEntry, onClose }: ConflictComparisonPanelProps) {
  const { resolve } = useConflictsSession();
  const { canManageBrands } = useBrandsSession();
  const [entry, setEntry] = useState(initialEntry);
  const [stage, setStage] = useState<Stage>("choose");
  const [selections, setSelections] = useState<Record<string, "local" | "remote">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<ConflictResolutionChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [staleNotice, setStaleNotice] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [initializedKey, setInitializedKey] = useState(`${initialEntry.entityType}:${initialEntry.id}`);

  // Un nouveau conflit a été ouvert (changement de `initialEntry`) : réinitialise l'état local
  // directement dans le rendu plutôt que dans un effet (voir CLAUDE.md — même patron que
  // BrandProfileView/OnboardingView pour éviter set-state-in-effect).
  const currentKey = `${initialEntry.entityType}:${initialEntry.id}`;
  if (initializedKey !== currentKey) {
    setInitializedKey(currentKey);
    setEntry(initialEntry);
    setStage("choose");
    setSelections({});
    setError(null);
    setStaleNotice(false);
    setSuccess(null);
  }

  const canResolve = entry.entityType !== "brands" || canManageBrands;
  const rows = useMemo(() => buildConflictFieldRows(entry.local, entry.remote), [entry]);
  const differingCount = rows.filter((row) => row.isDifferent).length;
  const bothSidesChanged = Boolean(entry.local) && differingCount > 0;

  const localUpdatedAt = entry.local?.updatedAt as string | undefined;
  const remoteUpdatedAt = entry.remote.updatedAt as string | undefined;
  const localIsNewer =
    localUpdatedAt && remoteUpdatedAt ? new Date(localUpdatedAt).getTime() > new Date(remoteUpdatedAt).getTime() : false;
  const remoteIsNewer =
    localUpdatedAt && remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime() : false;

  const title = getConflictTitle(entry.entityType, entry.local, entry.remote);

  function buildMergedRecord(): Record<string, unknown> {
    const base: Record<string, unknown> = { ...(entry.local ?? entry.remote) };
    for (const row of rows) {
      if (selections[row.key] === "remote") base[row.key] = row.remoteValue;
      else if (selections[row.key] === "local") base[row.key] = row.localValue;
    }
    return base;
  }

  async function submit(choice: ConflictResolutionChoice, mergedRecord?: Record<string, unknown>) {
    setIsSubmitting(true);
    setPendingChoice(choice);
    setError(null);
    setStaleNotice(false);

    const result = await resolve(entry, choice, mergedRecord);
    setIsSubmitting(false);
    setPendingChoice(null);

    if (result.error === "stale") {
      setStaleNotice(true);
      if (result.staleRemote) {
        setEntry((prev) => ({ ...prev, remoteRow: result.staleRemote!, remote: mapRowToRecord(result.staleRemote!) }));
      }
      setStage("choose");
      setSelections({});
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(
      choice === "defer"
        ? "Décision reportée."
        : navigator.onLine
          ? "Résolution enregistrée."
          : "Résolution enregistrée localement — elle sera envoyée dès le retour de la connexion."
    );
    setTimeout(onClose, 1400);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-3xl flex-col gap-5 overflow-y-auto border-l border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {CONFLICT_ENTITY_LABEL[entry.entityType]}
            </span>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {!canResolve && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            Seuls les administrateurs du workspace peuvent résoudre un conflit sur une marque.
          </p>
        )}

        {staleNotice && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            La version distante a changé pendant votre comparaison — elle a été actualisée ci-dessous. Merci de revérifier
            avant de choisir à nouveau.
          </p>
        )}

        {bothSidesChanged && (
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            Les deux versions contiennent des changements distincts ({differingCount} champ{differingCount > 1 ? "s" : ""}{" "}
            différent{differingCount > 1 ? "s" : ""}) — comparez-les avant de choisir.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version locale</span>
              {localIsNewer && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Plus récente
                </span>
              )}
            </div>
            {entry.local ? (
              <dl className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>Créée le</dt>
                  <dd>{formatDateTime(entry.local.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Modifiée le</dt>
                  <dd>{formatDateTime(entry.local.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Révision</dt>
                  <dd>{String(entry.local.revision ?? entry.lastSyncedRevision)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">N&apos;existe plus localement.</p>
            )}
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version distante</span>
              {remoteIsNewer && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Plus récente
                </span>
              )}
            </div>
            <dl className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Créée le</dt>
                <dd>{formatDateTime(entry.remote.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Modifiée le</dt>
                <dd>{formatDateTime(entry.remote.updatedAt)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Révision</dt>
                <dd>{String(entry.remote.revision ?? "—")}</dd>
              </div>
            </dl>
          </div>
        </div>

        <ConflictFieldDiff
          rows={rows}
          mode={stage === "merge" ? "merge" : "compare"}
          selections={selections}
          onSelect={(key, source) => setSelections((prev) => ({ ...prev, [key]: source }))}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {success}
          </p>
        )}

        {canResolve && stage === "choose" && (
          <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-4">
            <button
              type="button"
              disabled={isSubmitting || !entry.local}
              onClick={() => void submit("keep_local")}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {isSubmitting && pendingChoice === "keep_local" ? "Enregistrement…" : "Conserver local"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submit("keep_remote")}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {isSubmitting && pendingChoice === "keep_remote" ? "Enregistrement…" : "Conserver distant"}
            </button>
            <button
              type="button"
              disabled={isSubmitting || !entry.local}
              onClick={() => setStage("merge")}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Fusionner manuellement
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submit("defer")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:underline"
            >
              Reporter
            </button>
          </div>
        )}

        {canResolve && stage === "merge" && (
          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Sélectionnez la valeur souhaitée pour chaque champ différent ci-dessus, puis confirmez. Les deux versions
              originales restent inchangées tant que vous n&apos;avez pas confirmé.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStage("choose")}
                disabled={isSubmitting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void submit("merged", buildMergedRecord())}
                className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Enregistrement…" : "Confirmer la fusion"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
