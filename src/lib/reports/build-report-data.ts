import {
  aggregateTotals,
  getBestTimeSlots,
  getDailySeries,
  getFormatPerformance,
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
import { FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL, STATUS_LABEL } from "@/lib/post-status";
import type { ImportedMetricRecord } from "@/types/analytics";
import type { Brand } from "@/types/brand";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { ContentVersion } from "@/types/content-version";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";
import type { Publication, PublicationStatus } from "@/types/publication";
import type {
  RankedCount,
  ReportContentBreakdown,
  ReportKpiSnapshot,
  ReportPublicationSummary,
  ReportType,
  ReportWorkItemCounts,
} from "@/types/report";
import type { Topic, TopicBatch } from "@/types/topic-batch";

export interface BuildReportDataParams {
  brand: Brand;
  brands: Brand[];
  accounts: SocialAccount[];
  reportType: ReportType;
  /** Vide = toutes les plateformes. */
  platforms: SocialPlatform[];
  periodStart: string;
  periodEnd: string;
  comparePrevious: boolean;
  topics: Topic[];
  topicBatches: TopicBatch[];
  ideas: Idea[];
  contentVersions: ContentVersion[];
  publications: Publication[];
  importedMetrics: ImportedMetricRecord[];
  demoEnabled: boolean;
}

function inRange(dateIso: string | undefined, start: string, end: string): boolean {
  if (!dateIso) return false;
  const date = dateIso.slice(0, 10);
  return date >= start && date <= end;
}

function toRanked(map: Map<string, number>, labelFor: (key: string) => string): RankedCount[] {
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, label: labelFor(key), count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Décompte du travail réalisé dans ClickPost pour une marque sur une période — chaque champ est
 * un comptage direct d'enregistrements réels, jamais une estimation. Les sujets (`Topic`) n'ont
 * pas de date propre : on utilise la date de création de leur lot (`TopicBatch.createdAt`), les
 * sujets d'un même lot étant créés au même moment en pratique.
 */
function countWorkItems(params: {
  topics: Topic[];
  topicBatches: TopicBatch[];
  ideas: Idea[];
  contentVersions: ContentVersion[];
  publications: Publication[];
  brandId: string;
  brandName: string;
  start: string;
  end: string;
}): ReportWorkItemCounts {
  const { topics, topicBatches, ideas, contentVersions, publications, brandId, brandName, start, end } = params;

  const batchIdsInRange = new Set(
    topicBatches.filter((batch) => batch.brandId === brandId && inRange(batch.createdAt, start, end)).map((batch) => batch.id)
  );
  const topicsCreated = topics.filter((topic) => batchIdsInRange.has(topic.batchId)).length;

  const ideasForBrand = ideas.filter((idea) => idea.brandId === brandId);
  const ideasCreated = ideasForBrand.filter((idea) => inRange(idea.createdAt, start, end)).length;
  const ideaIdsForBrand = new Set(ideasForBrand.map((idea) => idea.id));
  const contentDrafted = contentVersions.filter(
    (version) => ideaIdsForBrand.has(version.ideaId) && inRange(version.createdAt, start, end)
  ).length;

  const publicationsForBrand = publications.filter((publication) => publication.brand === brandName);
  const contentScheduled = publicationsForBrand.filter(
    (publication) => publication.status === "scheduled" && inRange(publication.scheduledFor, start, end)
  ).length;
  const contentPublished = publicationsForBrand.filter(
    (publication) => publication.status === "published" && inRange(publication.scheduledFor, start, end)
  ).length;
  const contentArchived =
    ideasForBrand.filter((idea) => idea.status === "archived" && inRange(idea.updatedAt, start, end)).length +
    publicationsForBrand.filter(
      (publication) => publication.status === "archived" && inRange(publication.updatedAt ?? publication.scheduledFor, start, end)
    ).length;

  return { topicsCreated, ideasCreated, contentDrafted, contentScheduled, contentPublished, contentArchived };
}

function buildContentBreakdown(publications: Publication[]): ReportContentBreakdown {
  const byPlatformMap = new Map<string, number>();
  const byFormatMap = new Map<string, number>();
  const byThemeMap = new Map<string, number>();
  const byStatusMap = new Map<string, number>();

  for (const publication of publications) {
    byPlatformMap.set(publication.platform, (byPlatformMap.get(publication.platform) ?? 0) + 1);
    byFormatMap.set(publication.format, (byFormatMap.get(publication.format) ?? 0) + 1);
    const themeKey = publication.theme || "Sans thématique";
    byThemeMap.set(themeKey, (byThemeMap.get(themeKey) ?? 0) + 1);
    byStatusMap.set(publication.status, (byStatusMap.get(publication.status) ?? 0) + 1);
  }

  return {
    total: publications.length,
    byPlatform: toRanked(byPlatformMap, (key) => PLATFORM_LABEL[key as SocialPlatform] ?? key),
    byFormat: toRanked(byFormatMap, (key) => FORMAT_LABEL[key as ContentFormat] ?? key),
    byTheme: toRanked(byThemeMap, (key) => key),
    byStatus: toRanked(byStatusMap, (key) => STATUS_LABEL[key as PublicationStatus] ?? key),
  };
}

function toPublicationSummary(publication: {
  id: string;
  excerpt: string;
  platform: string;
  format: string;
  scheduledFor: string;
  engagementRate: number;
  performance: { source: "imported" | "demo" };
}): ReportPublicationSummary {
  return {
    id: publication.id,
    excerpt: publication.excerpt,
    platform: publication.platform,
    format: publication.format,
    scheduledFor: publication.scheduledFor,
    engagementRate: publication.engagementRate,
    source: publication.performance.source,
  };
}

/**
 * Construit le payload complet d'un rapport, entièrement côté client, en réutilisant le moteur
 * du module Performances (src/lib/analytics-report.ts) — jamais une seconde implémentation des
 * KPI. Aucune donnée n'est inventée : une section reste vide plutôt que fabriquée si aucune
 * donnée réelle n'est disponible pour la période/marque choisie.
 */
export function buildReportKpiSnapshot(params: BuildReportDataParams): ReportKpiSnapshot {
  const {
    brand,
    brands,
    accounts,
    reportType,
    platforms,
    periodStart,
    periodEnd,
    comparePrevious,
    topics,
    topicBatches,
    ideas,
    contentVersions,
    publications,
    importedMetrics,
    demoEnabled,
  } = params;

  const filters: PerformanceFilters = {
    brand: brand.name,
    accountId: "all",
    platform: platforms.length > 0 ? platforms : "all",
    startDate: periodStart,
    endDate: periodEnd,
  };

  const workDone = countWorkItems({
    topics,
    topicBatches,
    ideas,
    contentVersions,
    publications,
    brandId: brand.id,
    brandName: brand.name,
    start: periodStart,
    end: periodEnd,
  });

  const previousFilters = comparePrevious ? getPreviousPeriodFilters(filters) : null;
  const previousWorkDone = previousFilters
    ? countWorkItems({
        topics,
        topicBatches,
        ideas,
        contentVersions,
        publications,
        brandId: brand.id,
        brandName: brand.name,
        start: previousFilters.startDate,
        end: previousFilters.endDate,
      })
    : null;

  const publicationsInPeriod = publications.filter((publication) => {
    if (publication.brand !== brand.name) return false;
    if (platforms.length > 0 && !platforms.includes(publication.platform)) return false;
    const date = publication.scheduledFor.slice(0, 10);
    return date >= periodStart && date <= periodEnd;
  });
  const contentProduction = buildContentBreakdown(publicationsInPeriod);

  const { points: currentPoints, sources: currentSources } = getDailySeries(filters, accounts, brands, publications, importedMetrics, demoEnabled);
  const totals = aggregateTotals(currentPoints);
  const publishedCount = getPublishedCount(publications, filters);

  const previousResult = previousFilters ? getDailySeries(previousFilters, accounts, brands, publications, importedMetrics, demoEnabled) : null;
  const previousTotals = previousResult ? aggregateTotals(previousResult.points) : null;
  const previousPublishedCount = previousFilters ? getPublishedCount(publications, previousFilters) : null;

  const topPublications = getTopPublications(publications, filters, importedMetrics, demoEnabled).map(toPublicationSummary);
  const worstPublications = getWorstPublications(publications, filters, importedMetrics, demoEnabled).map(toPublicationSummary);
  const platformPerformance = getPlatformPerformance(publications, filters, importedMetrics, demoEnabled);
  const formatPerformance = getFormatPerformance(publications, filters, importedMetrics, demoEnabled);
  const themePerformance = getThemePerformance(publications, filters, importedMetrics, demoEnabled);
  const bestTimeSlots = getBestTimeSlots(publications, filters, importedMetrics, demoEnabled);

  const overallSources = mergeSourceSummaries(
    currentSources,
    ...platformPerformance.map((group) => group.sources),
    ...formatPerformance.map((group) => group.sources)
  );

  return {
    brandId: brand.id,
    brandName: brand.name,
    reportType,
    platforms,
    periodStart,
    periodEnd,
    hasPreviousPeriod: Boolean(previousFilters),
    workDone,
    previousWorkDone,
    contentProduction,
    performance: {
      sources: overallSources,
      totals,
      previousTotals,
      publishedCount,
      previousPublishedCount,
      topPublications,
      worstPublications,
      platformPerformance,
      formatPerformance,
      themePerformance,
      bestTimeSlot: bestTimeSlots.best,
    },
    qualitativeGoals: brand.communicationGoals ?? [],
  };
}

export function toIsoDateString(date: Date): string {
  return toISODate(date);
}
