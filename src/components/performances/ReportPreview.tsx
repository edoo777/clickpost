import type { PerformanceTotals } from "@/lib/analytics-report";

interface ReportPreviewProps {
  periodLabel: string;
  totals: PerformanceTotals;
  topPublicationExcerpt: string | null;
  topRecommendation: string | null;
}

export function ReportPreview({
  periodLabel,
  totals,
  topPublicationExcerpt,
  topRecommendation,
}: ReportPreviewProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Aperçu de rapport</h2>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
        >
          Exporter en PDF (bientôt disponible)
        </button>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-white/[.12] dark:text-zinc-400">
        <p className="font-medium text-zinc-950 dark:text-zinc-50">Rapport de performance — {periodLabel}</p>
        <p className="mt-2">
          {`${totals.impressions.toLocaleString("fr-FR")} impressions, ${totals.reach.toLocaleString(
            "fr-FR"
          )} de portée, taux d'engagement de ${totals.engagementRate.toFixed(1)}%.`}
        </p>
        {topPublicationExcerpt && <p className="mt-2">Meilleure publication : {topPublicationExcerpt}</p>}
        {topRecommendation && <p className="mt-2 italic">{topRecommendation}</p>}
      </div>
    </section>
  );
}
