"use client";

import { useState } from "react";
import { BestTimesHeatmap } from "@/components/performances/BestTimesHeatmap";
import { EvolutionChart } from "@/components/performances/EvolutionChart";
import { FormatPerformanceChart } from "@/components/performances/FormatPerformanceChart";
import { KpiGrid } from "@/components/performances/KpiGrid";
import {
  PerformancesFilters,
  type PeriodPreset,
  type PerformancesFiltersValue,
} from "@/components/performances/PerformancesFilters";
import { PlatformPerformanceChart } from "@/components/performances/PlatformPerformanceChart";
import { RecommendationsPanel } from "@/components/performances/RecommendationsPanel";
import { ReportPreview } from "@/components/performances/ReportPreview";
import { ThemePerformanceChart } from "@/components/performances/ThemePerformanceChart";
import { TopPublicationsList } from "@/components/performances/TopPublicationsList";
import { useAccountsSession } from "@/lib/accounts-store";
import {
  aggregateTotals,
  generateRecommendations,
  getBestTimeSlots,
  getDailySeries,
  getFormatPerformance,
  getPlatformPerformance,
  getPreviousPeriodFilters,
  getPublishedCount,
  getThemePerformance,
  getTopPublications,
  type PerformanceFilters,
} from "@/lib/analytics-report";
import { toISODate } from "@/lib/date-utils";
import { usePostsSession } from "@/lib/posts-store";

const periodDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function computeRangeForPreset(preset: PeriodPreset, today: Date): { startDate: string; endDate: string } {
  if (preset === "custom") {
    return { startDate: toISODate(today), endDate: toISODate(today) };
  }
  const days = Number(preset);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { startDate: toISODate(start), endDate: toISODate(today) };
}

function buildInitialFilters(): PerformancesFiltersValue {
  const today = new Date();
  const range = computeRangeForPreset("30", today);
  return {
    preset: "30",
    startDate: range.startDate,
    endDate: range.endDate,
    brand: "all",
    accountId: "all",
    platform: "all",
    compare: true,
  };
}

export function PerformancesView() {
  const { posts } = usePostsSession();
  const { accounts } = useAccountsSession();
  const [filters, setFilters] = useState<PerformancesFiltersValue>(buildInitialFilters);

  function handleFiltersChange(next: PerformancesFiltersValue) {
    if (next.preset !== filters.preset && next.preset !== "custom") {
      const range = computeRangeForPreset(next.preset, new Date());
      setFilters({ ...next, ...range });
      return;
    }
    setFilters(next);
  }

  const reportFilters: PerformanceFilters = {
    brand: filters.brand,
    accountId: filters.accountId,
    platform: filters.platform,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };

  const currentDailyPoints = getDailySeries(reportFilters, accounts);
  const totals = aggregateTotals(currentDailyPoints);
  const publishedCount = getPublishedCount(posts, reportFilters);

  const previousFilters = filters.compare ? getPreviousPeriodFilters(reportFilters) : null;
  const previousDailyPoints = previousFilters ? getDailySeries(previousFilters, accounts) : null;
  const previousTotals = previousDailyPoints ? aggregateTotals(previousDailyPoints) : null;
  const previousPublishedCount = previousFilters ? getPublishedCount(posts, previousFilters) : null;

  const topPublications = getTopPublications(posts, reportFilters);
  const platformPerformance = getPlatformPerformance(posts, reportFilters);
  const formatPerformance = getFormatPerformance(posts, reportFilters).slice(0, 6);
  const themePerformance = getThemePerformance(posts, reportFilters).slice(0, 6);
  const bestTimeSlots = getBestTimeSlots(posts, reportFilters);

  const recommendations = generateRecommendations({
    topFormat: formatPerformance[0] ?? null,
    topPlatform: platformPerformance[0] ?? null,
    topTheme: themePerformance[0] ?? null,
    bestTimeSlot: bestTimeSlots.best,
    currentTotals: totals,
    previousTotals,
  });

  const periodLabel = `${periodDateFormatter.format(new Date(`${filters.startDate}T00:00:00`))} – ${periodDateFormatter.format(
    new Date(`${filters.endDate}T00:00:00`)
  )}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          Performances et rapports
        </h1>
        <p className="text-sm text-muted-foreground ">
          Analyse des marques, comptes et publications pour identifier ce qui fonctionne le mieux.
        </p>
      </header>

      <PerformancesFilters value={filters} accounts={accounts} onChange={handleFiltersChange} />

      <KpiGrid
        totals={totals}
        previousTotals={previousTotals}
        publishedCount={publishedCount}
        previousPublishedCount={previousPublishedCount}
      />

      <EvolutionChart currentPoints={currentDailyPoints} previousPoints={previousDailyPoints} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlatformPerformanceChart data={platformPerformance} />
        <TopPublicationsList publications={topPublications} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormatPerformanceChart data={formatPerformance} />
        <ThemePerformanceChart data={themePerformance} />
      </div>

      <BestTimesHeatmap grid={bestTimeSlots.grid} best={bestTimeSlots.best} />

      <RecommendationsPanel recommendations={recommendations} />

      <ReportPreview
        periodLabel={periodLabel}
        totals={totals}
        topPublicationExcerpt={topPublications[0]?.excerpt ?? null}
        topRecommendation={recommendations[0] ?? null}
      />
    </div>
  );
}
