"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  dismissConflictNotice,
  flushNow,
  getStatusServerSnapshot,
  getStatusSnapshot,
  subscribeStatus,
} from "@/lib/persistence/coordinator";
import { processSyncQueue } from "@/lib/sync/runtime";
import { useSyncStatus } from "@/lib/sync/use-sync-status";

function useSaveStatus() {
  return useSyncExternalStore(subscribeStatus, getStatusSnapshot, getStatusServerSnapshot);
}

/** Libellé local affiché uniquement pour les états qui nécessitent réellement l'attention —
 * "saving" est intrinsèquement bref (le coordinateur repasse à "saved" quelques instants
 * après chaque sauvegarde débouncée), "error" reste jusqu'à résolution. Les états "tout va
 * bien" (idle/pending/saved) ne produisent plus aucun texte permanent dans la sidebar. */
function localNoticeLabel(status: string): string {
  if (status === "saving") return "Enregistrement…";
  if (status === "error") return "Sauvegarde impossible";
  return "";
}

/** Même principe côté synchronisation : seuls "error" et "conflict" justifient une notification. */
function syncNoticeLabel(status: string): string {
  if (status === "conflict") return "Conflit de synchronisation";
  if (status === "error") return "Erreur de synchronisation";
  return "";
}

interface SaveStatusIndicatorProps {
  /** Rendu réduit à une puce + infobulle, pour la barre latérale repliée. */
  collapsed?: boolean;
}

/**
 * Notification de sauvegarde/synchronisation — volontairement silencieuse lorsque tout
 * fonctionne normalement (aucune ligne permanente dans la sidebar). L'autosauvegarde, le
 * suivi d'état et le moteur de synchronisation ne changent pas : seul cet affichage devient
 * conditionnel, branché sur exactement les mêmes hooks/providers qu'avant.
 */
export function SaveStatusIndicator({ collapsed = false }: SaveStatusIndicatorProps) {
  const { status, errorMessage, conflictNotice } = useSaveStatus();
  const syncStatus = useSyncStatus();

  const localLabel = localNoticeLabel(status);
  const syncText = syncNoticeLabel(syncStatus.status);
  const hasNotice = Boolean(localLabel || syncText || conflictNotice);

  if (!hasNotice) return null;

  const dotClass = status === "error" ? "bg-destructive" : status === "saving" ? "bg-warning" : "bg-success";
  const syncDotClass = syncStatus.status === "conflict" || syncStatus.status === "error" ? "bg-destructive" : "bg-success";
  const combinedLabel = [localLabel, syncText].filter(Boolean).join(" · ") || "Notification de synchronisation";

  if (collapsed) {
    return (
      <div className="group relative flex items-center justify-center py-1.5" role="status">
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${syncText ? syncDotClass : dotClass}`} />
        <span className="sr-only">{combinedLabel}</span>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {combinedLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 px-4 pb-2" role="status" aria-live="polite">
      {localLabel && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
          <span className="truncate">{localLabel}</span>
          {status === "error" && (
            <button
              type="button"
              onClick={() => flushNow()}
              className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-violet-300 hover:underline"
            >
              Réessayer
            </button>
          )}
        </div>
      )}
      {status === "error" && errorMessage && <p className="text-[11px] text-white/40">{errorMessage}</p>}

      {syncText && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${syncDotClass}`} />
          <span className="truncate">{syncText}</span>
          {syncStatus.status === "error" && (
            <button
              type="button"
              onClick={() => void processSyncQueue()}
              className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-violet-300 hover:underline"
            >
              Réessayer
            </button>
          )}
          {syncStatus.status === "conflict" && (
            <Link
              href="/conflits"
              className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-violet-300 hover:underline"
            >
              Résoudre
            </Link>
          )}
        </div>
      )}
      {syncStatus.status === "conflict" && (
        <p className="text-[11px] text-amber-300">
          {syncStatus.conflictCount} enregistrement{syncStatus.conflictCount > 1 ? "s" : ""} en conflit — vos données locales
          sont conservées, aucune n&apos;a été perdue.{" "}
          <Link href="/conflits" className="font-semibold underline">
            Voir les conflits
          </Link>
        </p>
      )}

      {conflictNotice && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
          <span>Sauvegarde détectée dans un autre onglet.</span>
          <button type="button" onClick={() => dismissConflictNotice()} className="shrink-0 font-semibold hover:underline">
            OK
          </button>
        </div>
      )}
    </div>
  );
}
