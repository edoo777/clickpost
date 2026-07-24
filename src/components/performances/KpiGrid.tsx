import { KpiCard } from "@/components/performances/KpiCard";
import type { PerformanceTotals } from "@/lib/analytics-report";

interface KpiGridProps {
  totals: PerformanceTotals;
  previousTotals: PerformanceTotals | null;
  publishedCount: number;
  previousPublishedCount: number | null;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function KpiGrid({ totals, previousTotals, publishedCount, previousPublishedCount }: KpiGridProps) {
  const numberFormatter = new Intl.NumberFormat("fr-FR");

  const items: Array<{ label: string; current: number; previous?: number; format: (value: number) => string }> = [
    { label: "Impressions", current: totals.impressions, previous: previousTotals?.impressions, format: (v) => numberFormatter.format(v) },
    { label: "Portée", current: totals.reach, previous: previousTotals?.reach, format: (v) => numberFormatter.format(v) },
    { label: "Interactions", current: totals.interactions, previous: previousTotals?.interactions, format: (v) => numberFormatter.format(v) },
    { label: "Taux d'engagement", current: totals.engagementRate, previous: previousTotals?.engagementRate, format: (v) => `${v.toFixed(1)}%` },
    { label: "Clics", current: totals.clicks, previous: previousTotals?.clicks, format: (v) => numberFormatter.format(v) },
    { label: "Nouveaux abonnés", current: totals.newFollowers, previous: previousTotals?.newFollowers, format: (v) => numberFormatter.format(v) },
    {
      label: "Publications publiées",
      current: publishedCount,
      previous: previousPublishedCount ?? undefined,
      format: (v) => numberFormatter.format(v),
    },
  ];

  return (
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
  );
}
