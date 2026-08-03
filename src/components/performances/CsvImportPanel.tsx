"use client";

import { useRef, useState } from "react";
import { buildMetricsCsvTemplate, downloadCsv, parseMetricsCsv } from "@/lib/analytics-csv";
import type { ImportedMetricRecord } from "@/types/analytics";
import type { Publication } from "@/types/publication";

interface CsvImportPanelProps {
  publications: Publication[];
  currentUserName: string;
  onImport: (records: ImportedMetricRecord[]) => void;
}

/**
 * Seule voie d'entrée de données réelles dans /performances aujourd'hui (aucun fournisseur d'API
 * social configuré — voir stats-providers.ts). Exige un modèle avec identifiants de publication
 * réels pour éviter toute correspondance approximative par titre.
 */
export function CsvImportPanel({ publications, currentUserName, onImport }: CsvImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDownloadTemplate() {
    const csv = buildMetricsCsvTemplate(publications);
    downloadCsv(`clickpost-modele-metriques-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const knownIds = new Set(publications.map((publication) => publication.id));
    const { records, errors: parseErrors } = parseMetricsCsv(text, knownIds);
    setErrors(parseErrors);
    setImportedCount(records.length > 0 ? records.length : null);
    if (records.length === 0) return;

    const now = new Date().toISOString();
    const importedRecords: ImportedMetricRecord[] = records.map((record) => ({
      ...record,
      id: crypto.randomUUID(),
      importedAt: now,
      importedBy: currentUserName,
      sourceFileName: file.name,
    }));
    onImport(importedRecords);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5  ">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between text-left"
      >
        <h2 className="text-sm font-semibold text-foreground ">Importer des statistiques réelles (CSV)</h2>
        <span className="text-xs text-muted-foreground ">{isOpen ? "Réduire" : "Afficher"}</span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground ">
            Téléchargez le modèle pour les publications actuellement filtrées, complétez les
            colonnes de statistiques avec les vraies valeurs exportées de chaque plateforme, puis
            réimportez le fichier. Une nouvelle importation remplace toujours l&apos;ancienne pour
            les publications concernées — jamais cumulée silencieusement.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={publications.length === 0}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Télécharger le modèle
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              Importer un fichier CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileSelected} className="hidden" />
          </div>

          {importedCount !== null && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              {importedCount} ligne{importedCount > 1 ? "s" : ""} importée{importedCount > 1 ? "s" : ""} avec succès.
            </p>
          )}
          {errors.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-500/10">
              {errors.map((error, index) => (
                <p key={index} className="text-xs font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
