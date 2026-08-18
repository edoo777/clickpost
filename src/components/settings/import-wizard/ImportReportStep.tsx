"use client";

import { CONFLICT_ENTITY_LABEL } from "@/lib/conflict-display";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { journalKey } from "@/lib/sync/local-import-runner";
import type { SyncEntityType } from "@/lib/sync/types";
import type { ImportItemState, ImportJournalEntry, ImportScanResult } from "@/types/import-wizard";

interface ImportReportStepProps {
  scanResult: ImportScanResult;
  selectedKeys: Set<string>;
  journalByKey: Map<string, ImportJournalEntry>;
  onClose: () => void;
}

interface EntityCounts {
  imported: number;
  skipped: number;
  duplicate: number;
  conflict: number;
  error: number;
  toRetry: number;
}

function emptyCounts(): EntityCounts {
  return { imported: 0, skipped: 0, duplicate: 0, conflict: 0, error: 0, toRetry: 0 };
}

/** Étape 9 : rapport final (F1.8). Agrège le journal + la classification initiale du
 * balayage — téléchargeable en JSON, comme le reste des exports déjà présents dans l'app. */
export function ImportReportStep({ scanResult, selectedKeys, journalByKey, onClose }: ImportReportStepProps) {
  const t = useTranslations();
  const totals = emptyCounts();
  const perEntity: Partial<Record<SyncEntityType, EntityCounts>> = {};
  let attemptedNotSettled = 0;

  for (const candidate of scanResult.candidates) {
    const key = journalKey(candidate.entityType, candidate.recordId);
    if (!selectedKeys.has(key)) continue;
    const state: ImportItemState = journalByKey.get(key)?.state ?? "ready";
    const bucket = (perEntity[candidate.entityType] ??= emptyCounts());
    switch (state) {
      case "imported":
        totals.imported += 1;
        bucket.imported += 1;
        break;
      case "skipped":
        totals.skipped += 1;
        bucket.skipped += 1;
        break;
      case "duplicate":
        totals.duplicate += 1;
        bucket.duplicate += 1;
        break;
      case "conflict":
        totals.conflict += 1;
        bucket.conflict += 1;
        break;
      case "error":
        totals.error += 1;
        bucket.error += 1;
        break;
      default:
        totals.toRetry += 1;
        bucket.toRetry += 1;
        attemptedNotSettled += 1;
    }
  }

  const excludedDemo = Object.values(scanResult.excludedSeedCount).reduce((sum, n) => sum + (n ?? 0), 0);
  const notSelected = scanResult.candidates.length - selectedKeys.size;
  const remainingLocalOnly = notSelected + attemptedNotSettled;

  function downloadReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      imported: totals.imported,
      skipped: totals.skipped,
      excludedDemo,
      associatedExisting: totals.duplicate,
      conflicts: totals.conflict,
      errors: totals.error,
      remainingLocalOnly,
      perEntity,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clickpost-import-rapport-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {t("settings.importWizard.reportStep.intactNotice")}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("settings.importWizard.reportStep.importedLabel")} value={totals.imported} />
        <Stat label={t("settings.importWizard.reportStep.skippedLabel")} value={totals.skipped} />
        <Stat label={t("settings.importWizard.reportStep.excludedDemoLabel")} value={excludedDemo} />
        <Stat label={t("settings.importWizard.reportStep.associatedLabel")} value={totals.duplicate} />
        <Stat label={t("settings.importWizard.reportStep.conflictLabel")} value={totals.conflict} />
        <Stat label={t("settings.importWizard.reportStep.errorLabel")} value={totals.error} />
        <Stat label={t("settings.importWizard.reportStep.remainingLocalLabel")} value={remainingLocalOnly} />
      </div>

      {totals.conflict > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {totals.conflict > 1
            ? t("settings.importWizard.reportStep.conflictNoticePlural", { count: totals.conflict })
            : t("settings.importWizard.reportStep.conflictNoticeSingular", { count: totals.conflict })}
        </p>
      )}
      {attemptedNotSettled > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {attemptedNotSettled > 1
            ? t("settings.importWizard.reportStep.toRetryNoticePlural", { count: attemptedNotSettled })
            : t("settings.importWizard.reportStep.toRetryNoticeSingular", { count: attemptedNotSettled })}
        </p>
      )}

      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {(Object.entries(perEntity) as [SyncEntityType, EntityCounts][]).map(([entityType, counts]) => (
          <div key={entityType} className="flex items-center justify-between px-4 py-2 text-xs">
            <span className="font-medium text-foreground">{CONFLICT_ENTITY_LABEL[entityType]}</span>
            <span className="text-muted-foreground">
              {t("settings.importWizard.reportStep.entityStatsLine", {
                imported: counts.imported,
                skipped: counts.skipped,
                duplicate: counts.duplicate,
                conflict: counts.conflict,
                error: counts.error,
                toRetry: counts.toRetry,
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={downloadReport}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {t("settings.importWizard.reportStep.downloadReportButton")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
        >
          {t("settings.importWizard.reportStep.closeButton")}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
