"use client";

import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { EvolutionChart } from "@/components/performances/EvolutionChart";
import { useAccountsSession } from "@/lib/accounts-store";
import { buildDashboardPerformancePoints } from "@/lib/dashboard-performance";

interface PerformanceChartCardProps {
  filters?: DashboardFiltersValue;
}

export function PerformanceChartCard({ filters = DEFAULT_DASHBOARD_FILTERS }: PerformanceChartCardProps) {
  const { accounts } = useAccountsSession();
  const { current, previous } = buildDashboardPerformancePoints(filters, accounts);

  return <EvolutionChart currentPoints={current} previousPoints={previous} />;
}
