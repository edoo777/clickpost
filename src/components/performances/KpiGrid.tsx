import { KpiCard } from "@/components/performances/KpiCard";
import { MetricsSourceBadge } from "@/components/performances/MetricsSourceBadge";
import type { DataSourceSummary, PerformanceTotals } from "@/lib/analytics-report";

interface KpiGridProps {
  totals: PerformanceTotals;
  previousTotals: PerformanceTotals | null;
  publishedCount: number;
  previousPublishedCount: number | null;
  sources: DataSourceSummary;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function KpiGrid({ totals, previousTotals, publishedCount, previousPublishedCount, sources }: KpiGridProps) {
  const numberFormatter = new Intl.NumberFormat("fr-FR");

  const items: Array<{ label: string; current: number; previous?: number; format: (value: number) => string }> = [
    {
      label: "Publications publiées",
      current: publishedCount,
      previous: previousPublishedCount ?? undefined,
      format: (v) => numberFormatter.format(v),
    },
    { label: "Impressions", current: totals.impressions, previous: previousTotals?.impressions, format: (v) => numberFormatter.format(v) },
    { label: "Portée", current: totals.reach, previous: previousTotals?.reach, format: (v) => numberFormatter.format(v) },
    { label: "Vues", current: totals.views, previous: previousTotals?.views, format: (v) => numberFormatter.format(v) },
    { label: "Interactions", current: totals.interactions, previous: previousTotals?.interactions, format: (v) => numberFormatter.format(v) },
    { label: "Taux d'engagement", current: totals.engagementRate, previous: previousTotals?.engagementRate, format: (v) => `${v.toFixed(1)}%` },
    { label: "Réactions", current: totals.reactions, previous: previousTotals?.reactions, format: (v) => numberFormatter.format(v) },
    { label: "Commentaires", current: totals.comments, previous: previousTotals?.comments, format: (v) => numberFormatter.format(v) },
    { label: "Partages", current: totals.shares, previous: previousTotals?.shares, format: (v) => numberFormatter.format(v) },
    { label: "Sauvegardes", current: totals.saves, previous: previousTotals?.saves, format: (v) => numberFormatter.format(v) },
    { label: "Clics", current: totals.clicks, previous: previousTotals?.clicks, format: (v) => numberFormatter.format(v) },
    { label: "Nouveaux abonnés", current: totals.newFollowers, previous: previousTotals?.newFollowers, format: (v) => numberFormatter.format(v) },
    { label: "Conversions", current: totals.conversions, previous: previousTotals?.conversions, format: (v) => numberFormatter.format(v) },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">Indicateurs clés</h2>
        <MetricsSourceBadge sources={sources} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.format(item.current)}
            deltaPercent={item.previous !== undefined ? percentChange(item.current, item.previous) : null}
          />
        ))}
      </div>
    </div>
  );
}
