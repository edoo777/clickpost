"use client";

import { useState } from "react";
import { BestTimesHeatmap } from "@/components/performances/BestTimesHeatmap";
import { CsvImportPanel } from "@/components/performances/CsvImportPanel";
import { DemoDataToggle } from "@/components/performances/DemoDataToggle";
import { EvolutionChart } from "@/components/performances/EvolutionChart";
import { FormatPerformanceChart } from "@/components/performances/FormatPerformanceChart";
import { KpiGrid } from "@/components/performances/KpiGrid";
import { OptimizationPanel } from "@/components/performances/OptimizationPanel";
import {
  PerformancesFilters,
  type PeriodPreset,
  type PerformancesFiltersValue,
} from "@/components/performances/PerformancesFilters";
import { PlatformPerformanceChart } from "@/components/performances/PlatformPerformanceChart";
import { ReportPreview } from "@/components/performances/ReportPreview";
import { ThemePerformanceChart } from "@/components/performances/ThemePerformanceChart";
import { TopPublicationsList } from "@/components/performances/TopPublicationsList";
import { useAccountsSession } from "@/lib/accounts-store";
import {
  aggregateTotals,
  getBestTimeSlots,
  getContentTypePerformance,
  getCtaPerformance,
  getDailySeries,
  getFormatPerformance,
  getObjectivePerformance,
  getOwnerPerformance,
  getPlatformPerformance,
  getPreviousPeriodFilters,
  getPublishedCount,
  getThemePerformance,
  getTopPublications,
  getWorstPublications,
  mergeSourceSummaries,
  type PerformanceFilters,
} from "@/lib/analytics-report";
import { toISODate } from "@/lib/date-utils";
import { useBrandsSession } from "@/lib/brands-store";
import { isDemoAnalyticsEnabled, setDemoAnalyticsEnabled } from "@/lib/demo-data-preference";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useImportedMetricsSession } from "@/lib/imported-metrics-store";
import { buildOptimizationRecommendations } from "@/lib/optimization-recommendations";
import { usePostsSession } from "@/lib/posts-store";
import { useTeamSession } from "@/lib/team-store";

const periodDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

type Tab = "overview" | "optimization";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "optimization", label: "Optimisation" },
];

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
  const t = useTranslations();
  const { posts } = usePostsSession();
  const { accounts } = useAccountsSession();
  const { brands } = useBrandsSession();
  const { members, currentUserId } = useTeamSession();
  const { importedMetrics, importMetrics } = useImportedMetricsSession();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";

  const [tab, setTab] = useState<Tab>("overview");
  const [filters, setFilters] = useState<PerformancesFiltersValue>(buildInitialFilters);
  const [demoEnabled, setDemoEnabledState] = useState(() => isDemoAnalyticsEnabled());

  function handleDemoToggle(enabled: boolean) {
    setDemoEnabledState(enabled);
    setDemoAnalyticsEnabled(enabled);
  }

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

  const { points: currentDailyPoints, sources: currentSources } = getDailySeries(reportFilters, accounts, brands, posts, importedMetrics, demoEnabled);
  const totals = aggregateTotals(currentDailyPoints);
  const publishedCount = getPublishedCount(posts, reportFilters);

  const previousFilters = filters.compare ? getPreviousPeriodFilters(reportFilters) : null;
  const previousResult = previousFilters ? getDailySeries(previousFilters, accounts, brands, posts, importedMetrics, demoEnabled) : null;
  const previousTotals = previousResult ? aggregateTotals(previousResult.points) : null;
  const previousPublishedCount = previousFilters ? getPublishedCount(posts, previousFilters) : null;

  const topPublications = getTopPublications(posts, reportFilters, importedMetrics, demoEnabled);
  const worstPublications = getWorstPublications(posts, reportFilters, importedMetrics, demoEnabled);
  const platformPerformance = getPlatformPerformance(posts, reportFilters, importedMetrics, demoEnabled);
  const formatPerformance = getFormatPerformance(posts, reportFilters, importedMetrics, demoEnabled).slice(0, 6);
  const themePerformance = getThemePerformance(posts, reportFilters, importedMetrics, demoEnabled).slice(0, 6);
  const contentTypePerformance = getContentTypePerformance(posts, reportFilters, importedMetrics, demoEnabled).slice(0, 6);
  const objectivePerformance = getObjectivePerformance(posts, reportFilters, importedMetrics, demoEnabled).slice(0, 6);
  const ownerPerformance = getOwnerPerformance(posts, reportFilters, importedMetrics, demoEnabled).slice(0, 6);
  const ctaPerformance = getCtaPerformance(posts, reportFilters, importedMetrics, demoEnabled).slice(0, 6);
  const bestTimeSlots = getBestTimeSlots(posts, reportFilters, importedMetrics, demoEnabled);

  const overallSources = mergeSourceSummaries(
    currentSources,
    ...platformPerformance.map((group) => group.sources),
    ...formatPerformance.map((group) => group.sources)
  );

  const periodDays = Math.round(
    (new Date(`${filters.endDate}T00:00:00`).getTime() - new Date(`${filters.startDate}T00:00:00`).getTime()) / 86_400_000
  ) + 1;

  const activeBrand = filters.brand !== "all" ? brands.find((brand) => brand.name === filters.brand) : undefined;

  const recommendations = buildOptimizationRecommendations({
    topFormat: formatPerformance[0] ?? null,
    topTheme: themePerformance[0] ?? null,
    topPlatform: platformPerformance[0] ?? null,
    topCta: ctaPerformance[0] ?? null,
    bestTimeSlot: bestTimeSlots.best,
    currentTotals: totals,
    previousTotals,
    topPublications,
    worstPublications,
    publishedCount,
    periodDays,
    brand: activeBrand,
  });

  const periodLabel = `${periodDateFormatter.format(new Date(`${filters.startDate}T00:00:00`))} – ${periodDateFormatter.format(
    new Date(`${filters.endDate}T00:00:00`)
  )}`;

  const filteredPublications = posts.filter((publication) => {
    if (filters.brand !== "all" && publication.brand !== filters.brand) return false;
    if (filters.platform !== "all" && publication.platform !== filters.platform) return false;
    const date = publication.scheduledFor.slice(0, 10);
    return date >= filters.startDate && date <= filters.endDate;
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          {t("pageHeader.performancesAndReports")}
        </h1>
        <p className="text-sm text-muted-foreground ">
          Analyse des marques, comptes et publications pour identifier ce qui fonctionne le mieux.
        </p>
      </header>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        Aucune plateforme sociale n&apos;étant connectée par une intégration API réelle, seul le
        nombre de publications marquées « Publié » est garanti réel. Toute autre statistique
        provient d&apos;un import CSV manuel (voir ci-dessous) ou, si activées, de données de
        démonstration clairement identifiées.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "border-b-2 border-violet-600 text-violet-700 dark:text-violet-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <DemoDataToggle enabled={demoEnabled} onChange={handleDemoToggle} />
      </div>

      <PerformancesFilters value={filters} accounts={accounts} onChange={handleFiltersChange} />

      <CsvImportPanel publications={filteredPublications} currentUserName={currentUserName} onImport={importMetrics} />

      {tab === "overview" ? (
        <>
          <KpiGrid totals={totals} previousTotals={previousTotals} publishedCount={publishedCount} previousPublishedCount={previousPublishedCount} sources={overallSources} />

          <EvolutionChart currentPoints={currentDailyPoints} previousPoints={previousResult?.points ?? null} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PlatformPerformanceChart data={platformPerformance} />
            <TopPublicationsList publications={topPublications} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FormatPerformanceChart data={formatPerformance} />
            <ThemePerformanceChart data={themePerformance} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ThemePerformanceChart data={contentTypePerformance} title="Types de contenu les plus performants" />
            <ThemePerformanceChart data={objectivePerformance} title="Objectifs les plus performants" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ThemePerformanceChart data={ownerPerformance} title="Performance par responsable" />
            <ThemePerformanceChart data={ctaPerformance} title="Appels à l'action les plus performants" />
          </div>

          <BestTimesHeatmap grid={bestTimeSlots.grid} best={bestTimeSlots.best} />

          <TopPublicationsList publications={worstPublications} title="Publications les moins performantes" />

          <ReportPreview
            periodLabel={periodLabel}
            totals={totals}
            topPublicationExcerpt={topPublications[0]?.excerpt ?? null}
            topRecommendation={recommendations[0]?.text ?? null}
          />
        </>
      ) : (
        <OptimizationPanel recommendations={recommendations} brandId={activeBrand?.id} />
      )}
    </div>
  );
}
