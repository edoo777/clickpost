import type { DataSourceSummary } from "@/lib/analytics-report";

/** Rend explicite la provenance des chiffres affichés — jamais un mélange silencieux (voir
 * mergeSourceSummaries dans analytics-report.ts). Ne rend rien si aucune source (état vide). */
export function MetricsSourceBadge({ sources }: { sources: DataSourceSummary }) {
  if (!sources.hasImported && !sources.hasDemo) return null;

  if (sources.hasImported && sources.hasDemo) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        Importé + démonstration
      </span>
    );
  }
  if (sources.hasImported) {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        Importé
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      Démonstration
    </span>
  );
}
