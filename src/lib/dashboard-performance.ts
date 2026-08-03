import type { DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { getDailySeries, getPreviousPeriodFilters, type DataSourceSummary, type PerformanceFilters } from "@/lib/analytics-report";
import { toISODate } from "@/lib/date-utils";
import type { DailyMetricPoint, ImportedMetricRecord } from "@/types/analytics";
import type { Brand } from "@/types/brand";
import type { SocialAccount } from "@/types/dashboard";
import type { Publication } from "@/types/publication";

export interface DashboardPerformancePoints {
  current: DailyMetricPoint[];
  previous: DailyMetricPoint[];
  sources: DataSourceSummary;
  windowDays: number;
  perfFilters: PerformanceFilters;
}

/** Traduit les filtres du tableau de bord en fenêtre glissante + filtres de performance, réutilisé par les widgets KPI et le graphique. */
export function buildDashboardPerformancePoints(
  filters: DashboardFiltersValue,
  accounts: SocialAccount[],
  brands: Brand[],
  publications: Publication[],
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean
): DashboardPerformancePoints {
  const windowDays = Number(filters.period);
  const brandName =
    filters.brandId !== "all" ? brands.find((brand) => brand.id === filters.brandId)?.name : undefined;

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

  const current = getDailySeries(perfFilters, accounts, brands, publications, importedMetrics, demoEnabled);
  const previous = getDailySeries(getPreviousPeriodFilters(perfFilters), accounts, brands, publications, importedMetrics, demoEnabled);

  return {
    current: current.points,
    previous: previous.points,
    sources: current.sources,
    windowDays,
    perfFilters,
  };
}
