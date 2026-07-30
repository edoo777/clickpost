"use client";

import { useState } from "react";
import { IconClose } from "@/components/icons";
import { ImportBackupGateStep } from "@/components/settings/import-wizard/ImportBackupGateStep";
import { ImportProgressStep } from "@/components/settings/import-wizard/ImportProgressStep";
import { ImportReportStep } from "@/components/settings/import-wizard/ImportReportStep";
import { ImportReviewStep } from "@/components/settings/import-wizard/ImportReviewStep";
import { ImportScanStep } from "@/components/settings/import-wizard/ImportScanStep";
import { journalKey } from "@/lib/sync/local-import-runner";
import type { DuplicateAction, ImportJournalEntry, ImportScanResult } from "@/types/import-wizard";

type WizardStep = "scan" | "review" | "backup" | "progress" | "report";

const STEP_LABEL: Record<WizardStep, string> = {
  scan: "Analyse",
  review: "Sélection",
  backup: "Confirmation",
  progress: "Importation",
  report: "Rapport",
};
const STEP_ORDER: WizardStep[] = ["scan", "review", "backup", "progress", "report"];

interface ImportWizardModalProps {
  onClose: () => void;
}

/**
 * Assistant d'import des anciennes données locales (F1.8) — Paramètres → Données et
 * confidentialité → « Importer mes anciennes données locales ». Aucune écriture cloud avant
 * la confirmation explicite de l'étape 7 ; toute exécution passe par le moteur de
 * synchronisation existant (F1.4), jamais un second moteur.
 */
export function ImportWizardModal({ onClose }: ImportWizardModalProps) {
  const [step, setStep] = useState<WizardStep>("scan");
  const [scanResult, setScanResult] = useState<ImportScanResult | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [duplicateActions, setDuplicateActions] = useState<Map<string, DuplicateAction>>(new Map());
  const [brandOverrides, setBrandOverrides] = useState<Map<string, string>>(new Map());
  const [journalByKey, setJournalByKey] = useState<Map<string, ImportJournalEntry>>(new Map());

  function handleScanComplete(result: ImportScanResult) {
    setScanResult(result);
    const defaults = new Set<string>();
    for (const candidate of result.candidates) {
      const hasMissingRequired = candidate.dependencies.some((dep) => dep.required && dep.status === "missing");
      if (!hasMissingRequired) defaults.add(journalKey(candidate.entityType, candidate.recordId));
    }
    setSelectedKeys(defaults);
    setStep("review");
  }

  const stepIndex = STEP_ORDER.indexOf(step) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-5 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Importer mes anciennes données locales</h2>
            <p className="text-xs text-muted-foreground">
              Étape {stepIndex} sur {STEP_ORDER.length} — {STEP_LABEL[step]}
            </p>
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

        {step === "scan" && <ImportScanStep onComplete={handleScanComplete} />}

        {step === "review" && scanResult && (
          <ImportReviewStep
            scanResult={scanResult}
            selectedKeys={selectedKeys}
            onChangeSelectedKeys={setSelectedKeys}
            duplicateActions={duplicateActions}
            onChangeDuplicateActions={setDuplicateActions}
            brandOverrides={brandOverrides}
            onChangeBrandOverrides={setBrandOverrides}
            onNext={() => setStep("backup")}
            onCancel={onClose}
          />
        )}

        {step === "backup" && (
          <ImportBackupGateStep
            selectedCount={selectedKeys.size}
            onConfirm={() => setStep("progress")}
            onBack={() => setStep("review")}
          />
        )}

        {step === "progress" && scanResult && (
          <ImportProgressStep
            scanResult={scanResult}
            selectedKeys={selectedKeys}
            duplicateActions={duplicateActions}
            brandOverrides={brandOverrides}
            onJournalUpdate={(entry) => setJournalByKey((prev) => new Map(prev).set(entry.id, entry))}
            onComplete={() => setStep("report")}
          />
        )}

        {step === "report" && scanResult && (
          <ImportReportStep scanResult={scanResult} selectedKeys={selectedKeys} journalByKey={journalByKey} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
