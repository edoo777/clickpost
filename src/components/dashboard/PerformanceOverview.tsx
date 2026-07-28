"use client";

import { IconChartBar, IconSend, IconSparkles, IconUsers } from "@/components/icons";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAccountsSession } from "@/lib/accounts-store";
import { aggregateTotals, sumByDate } from "@/lib/analytics-report";
import { buildDashboardPerformancePoints } from "@/lib/dashboard-performance";
import type { DailyMetricPoint } from "@/types/analytics";

const numberFormatter = new Intl.NumberFormat("fr-FR");

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function engagementRateTrend(points: DailyMetricPoint[]): number[] {
  const byDate = new Map<string, { interactions: number; reach: number }>();
  for (const point of points) {
    const bucket = byDate.get(point.date) ?? { interactions: 0, reach: 0 };
    bucket.interactions += point.interactions;
    bucket.reach += point.reach;
    byDate.set(point.date, bucket);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, bucket]) => (bucket.reach > 0 ? (bucket.interactions / bucket.reach) * 100 : 0));
}

interface PerformanceOverviewProps {
  filters?: DashboardFiltersValue;
}

export function PerformanceOverview({ filters = DEFAULT_DASHBOARD_FILTERS }: PerformanceOverviewProps) {
  const { accounts } = useAccountsSession();
  const { current: currentPoints, previous: previousPoints, windowDays } = buildDashboardPerformancePoints(
    filters,
    accounts
  );
  const currentTotals = aggregateTotals(currentPoints);
  const previousTotals = aggregateTotals(previousPoints);

  const metrics = [
    {
      id: "impressions",
      label: `Impressions (${windowDays} j)`,
      value: numberFormatter.format(currentTotals.impressions),
      change: percentChange(currentTotals.impressions, previousTotals.impressions),
      icon: IconChartBar,
      accentClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
      trend: sumByDate(currentPoints, "impressions").map((point) => point.value),
    },
    {
      id: "engagement",
      label: "Taux d'engagement",
      value: `${currentTotals.engagementRate.toFixed(1)}%`,
      change: Math.round((currentTotals.engagementRate - previousTotals.engagementRate) * 10) / 10,
      icon: IconSparkles,
      accentClass: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
      trend: engagementRateTrend(currentPoints),
    },
    {
      id: "followers",
      label: "Nouveaux abonnés",
      value: numberFormatter.format(currentTotals.newFollowers),
      change: percentChange(currentTotals.newFollowers, previousTotals.newFollowers),
      icon: IconUsers,
      accentClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      trend: sumByDate(currentPoints, "newFollowers").map((point) => point.value),
    },
    {
      id: "clicks",
      label: "Clics sur les liens",
      value: numberFormatter.format(currentTotals.clicks),
      change: percentChange(currentTotals.clicks, previousTotals.clicks),
      icon: IconSend,
      accentClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      trend: sumByDate(currentPoints, "clicks").map((point) => point.value),
    },
  ];

  return (
    <section
      aria-label="Aperçu des performances"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {metrics.map((metric) => (
        <StatCard key={metric.id} {...metric} />
      ))}
    </section>
  );
}
