"use client";

import { useRef, useState } from "react";
import { ImportWizardModal } from "@/components/settings/import-wizard/ImportWizardModal";
import {
  applyImportedBackup,
  buildExportBackup,
  clearLocalData,
  downloadBackupFile,
  readImportFile,
  type ImportPreview,
} from "@/lib/persistence/coordinator";

type PendingAction = { type: "import"; preview: ImportPreview } | { type: "clear" };

export function DataPrivacySection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  function handleExport() {
    setErrorMessage(null);
    downloadBackupFile(buildExportBackup());
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setErrorMessage(null);
    try {
      const preview = await readImportFile(file);
      setPendingAction({ type: "import", preview });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Fichier de sauvegarde invalide.");
    }
  }

  async function confirmImport(preview: ImportPreview) {
    setIsBusy(true);
    try {
      await applyImportedBackup(preview.backup);
      window.location.reload();
    } catch {
      setIsBusy(false);
      setErrorMessage("L'import a échoué : vos données actuelles n'ont pas été modifiées.");
      setPendingAction(null);
    }
  }

  async function confirmClear() {
    setIsBusy(true);
    try {
      await clearLocalData();
      window.location.reload();
    } catch {
      setIsBusy(false);
      setErrorMessage("L'effacement a échoué. Réessayez.");
      setPendingAction(null);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Données et confidentialité</h2>
        <p className="text-xs text-muted-foreground">
          Vos données sont enregistrées automatiquement sur cet appareil (IndexedDB). Aucune donnée n&apos;est
          envoyée vers un serveur.
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Exporter mes données
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Importer une sauvegarde
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelected}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => setPendingAction({ type: "clear" })}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          Effacer les données locales
        </button>

        <button
          type="button"
          onClick={() => setIsImportWizardOpen(true)}
          className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/10"
        >
          Importer mes anciennes données locales
        </button>
      </div>

      {isImportWizardOpen && <ImportWizardModal onClose={() => setIsImportWizardOpen(false)} />}

      {pendingAction?.type === "import" && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Confirmer l&apos;import de cette sauvegarde ?
          </p>
          {pendingAction.preview.counts.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-xs text-amber-700 dark:text-amber-400">
              {pendingAction.preview.counts.map((entry) => (
                <li key={entry.label}>
                  {entry.count} {entry.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-400">Cette sauvegarde ne contient aucune donnée.</p>
          )}
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Votre état actuel sera conservé comme sauvegarde précédente avant le remplacement. La page se
            rechargera pour appliquer l&apos;import.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void confirmImport(pendingAction.preview)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
            >
              {isBusy ? "Import en cours…" : "Confirmer l'import"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setPendingAction(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {pendingAction?.type === "clear" && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Effacer définitivement toutes les données enregistrées sur cet appareil ? Cette action est
            irréversible.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void confirmClear()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isBusy ? "Effacement…" : "Oui, tout effacer"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setPendingAction(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
