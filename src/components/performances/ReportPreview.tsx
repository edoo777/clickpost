"use client";

import { buildReportExportCsv, downloadCsv } from "@/lib/analytics-csv";
import type { PerformanceTotals } from "@/lib/analytics-report";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";

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
  const t = useTranslations();
  const { locale } = useLocale();
  const localeCode = locale === "fr" ? "fr-FR" : "en-US";

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
        <h2 className="text-sm font-semibold text-foreground ">{t("performances.reportPreview.title")}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {t("performances.reportPreview.exportCsv")}
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
          >
            {t("performances.reportPreview.exportPdf")}
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-white/[.12] dark:text-zinc-400">
        <p className="font-medium text-foreground ">{t("performances.reportPreview.reportTitle", { period: periodLabel })}</p>
        <p className="mt-2">
          {t("performances.reportPreview.summary", {
            impressions: totals.impressions.toLocaleString(localeCode),
            reach: totals.reach.toLocaleString(localeCode),
            rate: totals.engagementRate.toFixed(1),
          })}
        </p>
        {topPublicationExcerpt && (
          <p className="mt-2">
            {t("performances.reportPreview.topPublicationPrefix")}
            {topPublicationExcerpt}
          </p>
        )}
        {topRecommendation && <p className="mt-2 italic">{topRecommendation}</p>}
      </div>
    </section>
  );
}
