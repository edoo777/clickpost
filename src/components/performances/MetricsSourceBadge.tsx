"use client";

import type { DataSourceSummary } from "@/lib/analytics-report";
import { useTranslations } from "@/lib/i18n/locale-provider";

/** Rend explicite la provenance des chiffres affichés — jamais un mélange silencieux (voir
 * mergeSourceSummaries dans analytics-report.ts). Sans aucune source (ni import, ni démonstration
 * — le cas de LinkedIn aujourd'hui, dont les portées actuelles ne donnent accès à aucune API de
 * statistiques, voir linkedin/stats-provider.ts), l'affiche explicitement plutôt que de laisser
 * un silence ambigu entre "aucune donnée" et "pas encore vérifié". */
export function MetricsSourceBadge({ sources }: { sources: DataSourceSummary }) {
  const t = useTranslations();
  if (!sources.hasImported && !sources.hasDemo) {
    return (
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {t("performances.metricsSource.notAvailable")}
      </span>
    );
  }

  if (sources.hasImported && sources.hasDemo) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        {t("performances.metricsSource.importedAndDemo")}
      </span>
    );
  }
  if (sources.hasImported) {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        {t("performances.metricsSource.imported")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      {t("performances.metricsSource.demo")}
    </span>
  );
}
