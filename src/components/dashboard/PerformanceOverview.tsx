"use client";

import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAccountsSession } from "@/lib/accounts-store";
import {
  aggregateTotals,
  getDailySeries,
  getPreviousPeriodFilters,
  type PerformanceFilters,
} from "@/lib/analytics-report";
import { brandProfiles } from "@/lib/brand-profiles";
import { toISODate } from "@/lib/date-utils";
import type { PerformanceMetric } from "@/types/dashboard";

const numberFormatter = new Intl.NumberFormat("fr-FR");

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

interface PerformanceOverviewProps {
  filters?: DashboardFiltersValue;
}

export function PerformanceOverview({ filters = DEFAULT_DASHBOARD_FILTERS }: PerformanceOverviewProps) {
  const { accounts } = useAccountsSession();
  const windowDays = Number(filters.period);
  const brandName = filters.brandId !== "all" ? brandProfiles.find((brand) => brand.id === filters.brandId)?.name : undefined;

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (windowDays - 1));

  const perfFilters: PerformanceFilters = {
    brand: brandName ?? "all",
    accountId: "all",
    platform: filters.platform,
    startDate: toISODate(startDate),
    endDate: toISODate(endDate),
  };

  const currentTotals = aggregateTotals(getDailySeries(perfFilters, accounts));
  const previousTotals = aggregateTotals(getDailySeries(getPreviousPeriodFilters(perfFilters), accounts));

  const metrics: PerformanceMetric[] = [
    {
      id: "impressions",
      label: `Impressions (${windowDays} j)`,
      value: numberFormatter.format(currentTotals.impressions),
      change: percentChange(currentTotals.impressions, previousTotals.impressions),
    },
    {
      id: "engagement",
      label: "Taux d'engagement",
      value: `${currentTotals.engagementRate.toFixed(1)}%`,
      change: Math.round((currentTotals.engagementRate - previousTotals.engagementRate) * 10) / 10,
    },
    {
      id: "followers",
      label: "Nouveaux abonnés",
      value: numberFormatter.format(currentTotals.newFollowers),
      change: percentChange(currentTotals.newFollowers, previousTotals.newFollowers),
    },
    {
      id: "clicks",
      label: "Clics sur les liens",
      value: numberFormatter.format(currentTotals.clicks),
      change: percentChange(currentTotals.clicks, previousTotals.clicks),
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
