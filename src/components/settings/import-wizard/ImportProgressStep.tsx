"use client";

import { useEffect, useRef, useState } from "react";
import { CONFLICT_ENTITY_LABEL } from "@/lib/conflict-display";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { journalKey, runImport } from "@/lib/sync/local-import-runner";
import type { DuplicateAction, ImportItemState, ImportJournalEntry, ImportScanResult } from "@/types/import-wizard";

interface ImportProgressStepProps {
  scanResult: ImportScanResult;
  selectedKeys: Set<string>;
  duplicateActions: Map<string, DuplicateAction>;
  brandOverrides: Map<string, string>;
  onJournalUpdate: (entry: ImportJournalEntry) => void;
  onComplete: () => void;
}

const STATE_CLASS: Record<ImportItemState, string> = {
  ready: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  importing: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  imported: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  skipped: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  duplicate: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  conflict: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  error: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  to_retry: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

/** Étape 8 : importation. Pilote uniquement `runImport` (file de synchronisation F1.4
 * existante) — n'écrit jamais directement vers Supabase (F1.8). */
export function ImportProgressStep({
  scanResult,
  selectedKeys,
  duplicateActions,
  brandOverrides,
  onJournalUpdate,
  onComplete,
}: ImportProgressStepProps) {
  const t = useTranslations();
  const STATE_LABEL: Record<ImportItemState, string> = {
    ready: t("settings.importWizard.progressStep.states.ready"),
    importing: t("settings.importWizard.progressStep.states.importing"),
    imported: t("settings.importWizard.progressStep.states.imported"),
    skipped: t("settings.importWizard.progressStep.states.skipped"),
    duplicate: t("settings.importWizard.progressStep.states.duplicate"),
    conflict: t("settings.importWizard.progressStep.states.conflict"),
    error: t("settings.importWizard.progressStep.states.error"),
    to_retry: t("settings.importWizard.progressStep.states.to_retry"),
  };
  const [entries, setEntries] = useState<Map<string, ImportJournalEntry>>(new Map());
  const [isDone, setIsDone] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    // Différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect).
    const timeout = setTimeout(() => {
      void runImport({
        candidates: scanResult.candidates,
        selectedKeys,
        duplicateActions,
        brandOverrides,
        remoteIdsByEntity: scanResult.remoteIdsByEntity,
        onProgress: (entry) => {
          setEntries((prev) => new Map(prev).set(entry.id, entry));
          onJournalUpdate(entry);
        },
      }).then(() => setIsDone(true));
    }, 0);
    return () => clearTimeout(timeout);
  }, [scanResult, selectedKeys, duplicateActions, brandOverrides, onJournalUpdate]);

  const selected = scanResult.candidates.filter((candidate) =>
    selectedKeys.has(journalKey(candidate.entityType, candidate.recordId))
  );
  const settledCount = Array.from(entries.values()).filter(
    (entry) => entry.state !== "importing" && entry.state !== "ready"
  ).length;
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-foreground">
        {isDone
          ? t("settings.importWizard.progressStep.statusLineDone", { done: settledCount, total: selected.length })
          : t("settings.importWizard.progressStep.statusLineInProgress", { done: settledCount, total: selected.length })}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all"
          style={{ width: `${selected.length > 0 ? (settledCount / selected.length) * 100 : 0}%` }}
        />
      </div>

      {isOffline && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {t("settings.importWizard.progressStep.offlineNotice")}
        </p>
      )}

      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
        {selected.map((candidate) => {
          const key = journalKey(candidate.entityType, candidate.recordId);
          const entry = entries.get(key);
          const state = entry?.state ?? "ready";
          return (
            <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs">
              <span className="truncate">
                <span className="mr-1.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {CONFLICT_ENTITY_LABEL[candidate.entityType]}
                </span>
                {candidate.title}
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATE_CLASS[state]}`}>
                {STATE_LABEL[state]}
              </span>
            </div>
          );
        })}
      </div>

      {isDone && (
        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
          >
            {t("settings.importWizard.progressStep.viewReportButton")}
          </button>
        </div>
      )}
    </div>
  );
}
