import type { DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { getDailySeries, getPreviousPeriodFilters, type PerformanceFilters } from "@/lib/analytics-report";
import { brandProfiles } from "@/lib/brand-profiles";
import { toISODate } from "@/lib/date-utils";
import type { DailyMetricPoint } from "@/types/analytics";
import type { SocialAccount } from "@/types/dashboard";

export interface DashboardPerformancePoints {
  current: DailyMetricPoint[];
  previous: DailyMetricPoint[];
  windowDays: number;
  perfFilters: PerformanceFilters;
}

/** Traduit les filtres du tableau de bord en fenêtre glissante + filtres de performance, réutilisé par les widgets KPI et le graphique. */
export function buildDashboardPerformancePoints(
  filters: DashboardFiltersValue,
  accounts: SocialAccount[]
): DashboardPerformancePoints {
  const windowDays = Number(filters.period);
  const brandName =
    filters.brandId !== "all" ? brandProfiles.find((brand) => brand.id === filters.brandId)?.name : undefined;

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

  return {
    current: getDailySeries(perfFilters, accounts),
    previous: getDailySeries(getPreviousPeriodFilters(perfFilters), accounts),
    windowDays,
    perfFilters,
  };
}
