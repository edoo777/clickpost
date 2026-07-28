"use client";

import { useSyncExternalStore } from "react";
import {
  dismissConflictNotice,
  flushNow,
  getStatusServerSnapshot,
  getStatusSnapshot,
  subscribeStatus,
} from "@/lib/persistence/coordinator";

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours().toString().padStart(2, "0")}h${date.getMinutes().toString().padStart(2, "0")}`;
}

function useSaveStatus() {
  return useSyncExternalStore(subscribeStatus, getStatusSnapshot, getStatusServerSnapshot);
}

interface SaveStatusIndicatorProps {
  /** Rendu réduit à une puce + infobulle, pour la barre latérale repliée. */
  collapsed?: boolean;
}

export function SaveStatusIndicator({ collapsed = false }: SaveStatusIndicatorProps) {
  const { status, lastSavedAt, errorMessage, conflictNotice } = useSaveStatus();

  const label =
    status === "saving"
      ? "Enregistrement…"
      : status === "pending"
        ? "Modifications en cours"
        : status === "error"
          ? "Sauvegarde impossible"
          : lastSavedAt
            ? `Enregistré à ${formatTime(lastSavedAt)}`
            : "Enregistré";

  const dotClass =
    status === "error" ? "bg-destructive" : status === "saving" || status === "pending" ? "bg-warning" : "bg-success";

  if (collapsed) {
    return (
      <div className="group relative flex items-center justify-center py-1.5" role="status">
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        <span className="sr-only">{label}</span>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5" role="status" aria-live="polite">
      <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        <span className="truncate">{label}</span>
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
      {status === "error" && errorMessage && <p className="text-[11px] text-white/40">{errorMessage}</p>}
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
