"use client";

import { useState } from "react";
import { buildExportBackup, downloadBackupFile } from "@/lib/persistence/coordinator";

interface ImportBackupGateStepProps {
  selectedCount: number;
  onConfirm: () => void;
  onBack: () => void;
}

/** Étape 7 : confirmation. Une sauvegarde JSON est obligatoire avant de pouvoir continuer —
 * IndexedDB n'est jamais vidée, aucune écriture cloud n'a encore eu lieu (F1.8). */
export function ImportBackupGateStep({ selectedCount, onConfirm, onBack }: ImportBackupGateStepProps) {
  const [hasDownloaded, setHasDownloaded] = useState(false);

  function handleDownload() {
    downloadBackupFile(buildExportBackup());
    setHasDownloaded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Vous êtes sur le point d&apos;envoyer <strong className="text-foreground">{selectedCount}</strong> élément
        {selectedCount > 1 ? "s" : ""} vers votre workspace cloud actif. Vos données locales (IndexedDB) ne seront ni
        modifiées ni supprimées par cette opération.
      </p>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-300">
          Téléchargez une sauvegarde avant de continuer — obligatoire.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30"
        >
          {hasDownloaded ? "Sauvegarde téléchargée ✓ — retélécharger" : "Télécharger la sauvegarde JSON"}
        </button>
      </div>

      <div className="flex justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Retour
        </button>
        <button
          type="button"
          disabled={!hasDownloaded}
          onClick={onConfirm}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmer et importer
        </button>
      </div>
    </div>
  );
}
