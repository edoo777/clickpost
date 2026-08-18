"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { scanLocalDataForImport } from "@/lib/sync/local-import-scan";
import type { ImportScanResult } from "@/types/import-wizard";

interface ImportScanStepProps {
  onComplete: (result: ImportScanResult) => void;
}

/** Étapes 1-2 : analyse locale puis résumé par catégorie (F1.8). Lecture seule — aucune
 * écriture locale ou distante n'a lieu à cette étape. */
export function ImportScanStep({ onComplete }: ImportScanStepProps) {
  const t = useTranslations();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setIsScanning(true);
    setError(null);
    try {
      const result = await scanLocalDataForImport();
      onComplete(result);
    } catch {
      setError(t("settings.importWizard.scanStep.error"));
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="max-w-md text-sm text-muted-foreground">
        {t("settings.importWizard.scanStep.description")}
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={isScanning}
        onClick={() => void runScan()}
        className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isScanning ? t("settings.importWizard.scanStep.scanning") : t("settings.importWizard.scanStep.scanButton")}
      </button>
    </div>
  );
}
