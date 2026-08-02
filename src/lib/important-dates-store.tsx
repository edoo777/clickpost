"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import { getCurrentWorkspaceId } from "@/lib/sync/runtime";
import type { ImportantDate } from "@/types/important-date";

export interface ImportantDateDraft {
  category: ImportantDate["category"];
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  country?: string;
  region?: string;
  brandId?: string;
}

interface ImportantDatesSessionValue {
  importantDates: ImportantDate[];
  addImportantDate: (draft: ImportantDateDraft, createdBy: string) => ImportantDate;
  updateImportantDate: (id: string, patch: Partial<ImportantDateDraft>) => void;
  archiveImportantDate: (id: string) => void;
  restoreImportantDate: (id: string) => void;
  removeImportantDate: (id: string) => void;
}

const ImportantDatesSessionContext = createContext<ImportantDatesSessionValue | null>(null);

export function ImportantDatesSessionProvider({ children }: { children: ReactNode }) {
  const [importantDates, setImportantDates] = useSyncedPersistedState("importantDates", [], "importantDates");

  const value = useMemo<ImportantDatesSessionValue>(
    () => ({
      importantDates,
      addImportantDate: (draft, createdBy) => {
        const now = new Date().toISOString();
        const entry: ImportantDate = {
          id: crypto.randomUUID(),
          workspaceId: getCurrentWorkspaceId() ?? "",
          category: draft.category,
          title: draft.title,
          description: draft.description,
          startDate: draft.startDate,
          endDate: draft.endDate,
          country: draft.country,
          region: draft.region,
          brandId: draft.brandId,
          source: "manual",
          status: "active",
          createdBy,
          createdAt: now,
          updatedAt: now,
        };
        setImportantDates((prev) => [...prev, entry]);
        return entry;
      },
      updateImportantDate: (id, patch) =>
        setImportantDates((prev) =>
          prev.map((entry) => (entry.id === id ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry))
        ),
      archiveImportantDate: (id) =>
        setImportantDates((prev) =>
          prev.map((entry) => (entry.id === id ? { ...entry, status: "archived", updatedAt: new Date().toISOString() } : entry))
        ),
      restoreImportantDate: (id) =>
        setImportantDates((prev) =>
          prev.map((entry) => (entry.id === id ? { ...entry, status: "active", updatedAt: new Date().toISOString() } : entry))
        ),
      removeImportantDate: (id) => setImportantDates((prev) => prev.filter((entry) => entry.id !== id)),
    }),
    [importantDates, setImportantDates]
  );

  return <ImportantDatesSessionContext.Provider value={value}>{children}</ImportantDatesSessionContext.Provider>;
}

export function useImportantDatesSession() {
  const context = useContext(ImportantDatesSessionContext);
  if (!context) {
    throw new Error("useImportantDatesSession must be used within an ImportantDatesSessionProvider");
  }
  return context;
}
