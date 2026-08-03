"use client";

import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { EvolutionChart } from "@/components/performances/EvolutionChart";
import { useAccountsSession } from "@/lib/accounts-store";
import { useBrandsSession } from "@/lib/brands-store";
import { buildDashboardPerformancePoints } from "@/lib/dashboard-performance";
import { isDemoAnalyticsEnabled } from "@/lib/demo-data-preference";
import { useImportedMetricsSession } from "@/lib/imported-metrics-store";
import { usePostsSession } from "@/lib/posts-store";

interface PerformanceChartCardProps {
  filters?: DashboardFiltersValue;
}

export function PerformanceChartCard({ filters = DEFAULT_DASHBOARD_FILTERS }: PerformanceChartCardProps) {
  const { accounts } = useAccountsSession();
  const { brands } = useBrandsSession();
  const { posts } = usePostsSession();
  const { importedMetrics } = useImportedMetricsSession();
  const { current, previous } = buildDashboardPerformancePoints(filters, accounts, brands, posts, importedMetrics, isDemoAnalyticsEnabled());

  return <EvolutionChart currentPoints={current} previousPoints={previous} />;
}
