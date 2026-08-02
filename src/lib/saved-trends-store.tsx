"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getCurrentWorkspaceId } from "@/lib/sync/runtime";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import type { SavedTrend, SavedTrendStatus } from "@/types/trend";

export interface SavedTrendDraft {
  brandId?: string;
  provider: string;
  externalId?: string;
  title: string;
  sourceUrl: string;
  notes?: string;
  status: SavedTrendStatus;
}

interface SavedTrendsSessionValue {
  savedTrends: SavedTrend[];
  /** Enregistre ou met à jour le statut d'une tendance (Enregistrer / Masquer / Non pertinente)
   * — une seule entrée par (provider, externalId), jamais de doublon sur double clic. */
  saveTrend: (draft: SavedTrendDraft, createdBy: string) => SavedTrend;
  removeSavedTrend: (id: string) => void;
}

const SavedTrendsSessionContext = createContext<SavedTrendsSessionValue | null>(null);

export function SavedTrendsSessionProvider({ children }: { children: ReactNode }) {
  const [savedTrends, setSavedTrends] = useSyncedPersistedState("savedTrends", [], "savedTrends");

  const value = useMemo<SavedTrendsSessionValue>(
    () => ({
      savedTrends,
      saveTrend: (draft, createdBy) => {
        const now = new Date().toISOString();
        const existing = draft.externalId
          ? savedTrends.find((entry) => entry.provider === draft.provider && entry.externalId === draft.externalId)
          : undefined;

        if (existing) {
          const updated: SavedTrend = { ...existing, status: draft.status, notes: draft.notes ?? existing.notes, updatedAt: now };
          setSavedTrends((prev) => prev.map((entry) => (entry.id === existing.id ? updated : entry)));
          return updated;
        }

        const entry: SavedTrend = {
          id: crypto.randomUUID(),
          workspaceId: getCurrentWorkspaceId() ?? "",
          brandId: draft.brandId,
          provider: draft.provider,
          externalId: draft.externalId,
          title: draft.title,
          sourceUrl: draft.sourceUrl,
          notes: draft.notes,
          status: draft.status,
          savedBy: createdBy,
          createdAt: now,
          updatedAt: now,
        };
        setSavedTrends((prev) => [...prev, entry]);
        return entry;
      },
      removeSavedTrend: (id) => setSavedTrends((prev) => prev.filter((entry) => entry.id !== id)),
    }),
    [savedTrends, setSavedTrends]
  );

  return <SavedTrendsSessionContext.Provider value={value}>{children}</SavedTrendsSessionContext.Provider>;
}

export function useSavedTrendsSession() {
  const context = useContext(SavedTrendsSessionContext);
  if (!context) {
    throw new Error("useSavedTrendsSession must be used within a SavedTrendsSessionProvider");
  }
  return context;
}
