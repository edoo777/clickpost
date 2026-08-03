import { buildReportExportCsv, downloadCsv } from "@/lib/analytics-csv";
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
  function handleExportCsv() {
    const csv = buildReportExportCsv([
      {
        periode: periodLabel,
        impressions: totals.impressions,
        portee: totals.reach,
        vues: totals.views,
        interactions: totals.interactions,
        reactions: totals.reactions,
        commentaires: totals.comments,
        partages: totals.shares,
        sauvegardes: totals.saves,
        clics: totals.clicks,
        nouveaux_abonnes: totals.newFollowers,
        conversions: totals.conversions,
        taux_engagement: `${totals.engagementRate.toFixed(2)}%`,
      },
    ]);
    downloadCsv(`clickpost-rapport-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground ">Aperçu de rapport</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Exporter en CSV
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
          >
            Exporter en PDF (bientôt disponible)
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-white/[.12] dark:text-zinc-400">
        <p className="font-medium text-foreground ">Rapport de performance — {periodLabel}</p>
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
