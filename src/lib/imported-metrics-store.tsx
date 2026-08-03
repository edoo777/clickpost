"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistedState } from "@/lib/persistence/use-persisted-state";
import type { ImportedMetricRecord } from "@/types/analytics";

interface ImportedMetricsSessionValue {
  importedMetrics: ImportedMetricRecord[];
  /** Remplace toute importation précédente pour chaque publicationId présent dans `records` —
   * une nouvelle importation pour une publication déjà importée écrase l'ancienne (jamais
   * cumulée silencieusement, jamais mélangée à l'ancienne valeur). */
  importMetrics: (records: ImportedMetricRecord[]) => void;
  removeImportedMetric: (publicationId: string) => void;
  clearImportedMetrics: () => void;
}

const ImportedMetricsSessionContext = createContext<ImportedMetricsSessionValue | null>(null);

/**
 * Persistance locale uniquement (IndexedDB via usePersistedState, jamais useSyncedPersistedState)
 * — ces données ne sont pas encore synchronisées vers Supabase entre appareils. Décision de
 * périmètre documentée dans docs/overnight-progress.md : chaque colonne synchronisée doit avoir
 * une colonne Postgres réelle (voir la régression corrigée par la migration
 * 20260803144505_publications_attempts_content_type.sql) ; ajouter une table dédiée avec RLS pour
 * ces métriques importées est un travail distinct, réel mais non inclus dans cette phase.
 */
export function ImportedMetricsSessionProvider({ children }: { children: ReactNode }) {
  const [importedMetrics, setImportedMetrics] = usePersistedState<"importedMetrics">("importedMetrics", []);

  const value = useMemo<ImportedMetricsSessionValue>(
    () => ({
      importedMetrics,
      importMetrics: (records) =>
        setImportedMetrics((prev) => {
          const incomingIds = new Set(records.map((record) => record.publicationId));
          return [...prev.filter((record) => !incomingIds.has(record.publicationId)), ...records];
        }),
      removeImportedMetric: (publicationId) =>
        setImportedMetrics((prev) => prev.filter((record) => record.publicationId !== publicationId)),
      clearImportedMetrics: () => setImportedMetrics([]),
    }),
    [importedMetrics, setImportedMetrics]
  );

  return <ImportedMetricsSessionContext.Provider value={value}>{children}</ImportedMetricsSessionContext.Provider>;
}

export function useImportedMetricsSession() {
  const context = useContext(ImportedMetricsSessionContext);
  if (!context) {
    throw new Error("useImportedMetricsSession must be used within an ImportedMetricsSessionProvider");
  }
  return context;
}
