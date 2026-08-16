import { DEMO_PUBLICATION_PERFORMANCE, generateDailySeries } from "@/lib/analytics-data";
import { CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { toISODate } from "@/lib/date-utils";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { Brand } from "@/types/brand";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { DailyMetricPoint, ImportedMetricRecord, MetricsSource, MetricValues, PublicationPerformance } from "@/types/analytics";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Publication } from "@/types/publication";

export interface PerformanceFilters {
  brand: string | "all";
  accountId: string | "all";
  /** Une plateforme unique (usage historique, Performances), plusieurs (Rapports, F-Rapports v2)
   * ou "all". Un tableau vide se comporte comme "all" — jamais un filtre qui exclut tout. */
  platform: SocialPlatform | SocialPlatform[] | "all";
  startDate: string;
  endDate: string;
}

/** Jamais un mélange silencieux : toute vue agrégée doit pouvoir afficher d'où viennent les
 * chiffres qu'elle montre. */
export interface DataSourceSummary {
  hasImported: boolean;
  hasDemo: boolean;
}

export function mergeSourceSummaries(...summaries: DataSourceSummary[]): DataSourceSummary {
  return {
    hasImported: summaries.some((summary) => summary.hasImported),
    hasDemo: summaries.some((summary) => summary.hasDemo),
  };
}

const TIME_SLOTS = [
  { key: "morning", label: "Matin", from: 5, to: 11 },
  { key: "midday", label: "Midi", from: 11, to: 14 },
  { key: "afternoon", label: "Après-midi", from: 14, to: 18 },
  { key: "evening", label: "Soir", from: 18, to: 24 },
] as const;

const WEEKDAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getTimeSlot(hour: number): (typeof TIME_SLOTS)[number] {
  return TIME_SLOTS.find((slot) => hour >= slot.from && hour < slot.to) ?? TIME_SLOTS[0];
}

/** Résout la performance d'une publication : priorité absolue à une importation manuelle réelle
 * (la plus récente pour cette publication) ; sinon, uniquement si la démonstration est activée
 * explicitement, une valeur de démonstration ; sinon `null` (état vide honnête). */
function resolvePublicationPerformance(
  publication: Publication,
  importedByPublicationId: Map<string, ImportedMetricRecord>,
  demoEnabled: boolean
): PublicationPerformance | null {
  const imported = importedByPublicationId.get(publication.id);
  if (imported) {
    return {
      publicationId: publication.id,
      impressions: imported.impressions,
      reach: imported.reach,
      views: imported.views,
      interactions: imported.interactions,
      reactions: imported.reactions,
      comments: imported.comments,
      shares: imported.shares,
      saves: imported.saves,
      clicks: imported.clicks,
      newFollowers: imported.newFollowers,
      conversions: imported.conversions,
      source: "imported",
    };
  }
  if (demoEnabled) return DEMO_PUBLICATION_PERFORMANCE[publication.id] ?? null;
  return null;
}

function matchesPlatform(publicationPlatform: SocialPlatform, filterPlatform: PerformanceFilters["platform"]): boolean {
  if (filterPlatform === "all") return true;
  const allowed = Array.isArray(filterPlatform) ? filterPlatform : [filterPlatform];
  return allowed.length === 0 || allowed.includes(publicationPlatform);
}

function matchesFilters(publication: Publication, filters: PerformanceFilters): boolean {
  if (filters.brand !== "all" && publication.brand !== filters.brand) return false;
  if (!matchesPlatform(publication.platform, filters.platform)) return false;
  if (filters.accountId !== "all" && publication.accountId !== filters.accountId) return false;
  const date = publication.scheduledFor.slice(0, 10);
  if (date < filters.startDate || date > filters.endDate) return false;
  return true;
}

export type PerformedPublication = Publication & { performance: PublicationPerformance; engagementRate: number };

export function getMatchingPerformedPublications(
  publications: Publication[],
  filters: PerformanceFilters,
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean
): PerformedPublication[] {
  const importedByPublicationId = new Map(importedMetrics.map((record) => [record.publicationId, record]));
  return publications
    .filter((publication) => matchesFilters(publication, filters))
    .map((publication) => {
      const performance = resolvePublicationPerformance(publication, importedByPublicationId, demoEnabled);
      if (!performance) return null;
      const engagementRate = performance.reach > 0 ? (performance.interactions / performance.reach) * 100 : 0;
      return { ...publication, performance, engagementRate };
    })
    .filter((value): value is PerformedPublication => value !== null);
}

/** Le seul chiffre garanti réel indépendamment de tout import ou de la démonstration : le nombre
 * de publications réellement marquées « Publié » (voir ManualPublishPanel, Phase D) sur la
 * période. Ne dépend jamais de la résolution d'une performance. */
export function getPublishedCount(publications: Publication[], filters: PerformanceFilters): number {
  return publications.filter((publication) => matchesFilters(publication, filters) && publication.status === "published").length;
}

export function getDailySeries(
  filters: PerformanceFilters,
  accounts: SocialAccount[],
  brands: Brand[],
  publications: Publication[],
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean
): { points: DailyMetricPoint[]; sources: DataSourceSummary } {
  const importedByPublicationId = new Map(importedMetrics.map((record) => [record.publicationId, record]));
  const points: DailyMetricPoint[] = [];
  const importedBrandPlatformKeys = new Set<string>();

  for (const publication of publications) {
    if (!matchesFilters(publication, filters)) continue;
    const imported = importedByPublicationId.get(publication.id);
    if (!imported) continue;
    importedBrandPlatformKeys.add(`${publication.brand}-${publication.platform}`);
    points.push({
      date: publication.scheduledFor.slice(0, 10),
      brand: publication.brand,
      platform: publication.platform,
      source: "imported",
      impressions: imported.impressions,
      reach: imported.reach,
      views: imported.views,
      interactions: imported.interactions,
      reactions: imported.reactions,
      comments: imported.comments,
      shares: imported.shares,
      saves: imported.saves,
      clicks: imported.clicks,
      newFollowers: imported.newFollowers,
      conversions: imported.conversions,
    });
  }

  let hasDemo = false;
  if (demoEnabled) {
    const brandNames = filters.brand === "all" ? brands.map((brand) => brand.name) : [filters.brand];
    const start = new Date(`${filters.startDate}T00:00:00`);
    const end = new Date(`${filters.endDate}T00:00:00`);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

    if (days > 0) {
      for (const brandName of brandNames) {
        const brandProfile = brands.find((brand) => brand.name === brandName);
        if (!brandProfile) continue;

        let platforms: SocialPlatform[] = brandProfile.socialPlatforms;
        platforms = platforms.filter((platform) => matchesPlatform(platform, filters.platform));
        if (filters.accountId !== "all") {
          const account = accounts.find((candidate) => candidate.id === filters.accountId);
          platforms = account ? platforms.filter((platform) => platform === account.platform) : [];
        }

        for (const platform of platforms) {
          // Jamais de démonstration superposée à une importation réelle pour le même couple
          // marque/plateforme — évite un mélange silencieux au sein d'une même série.
          if (importedBrandPlatformKeys.has(`${brandName}-${platform}`)) continue;
          const demoPoints = generateDailySeries(brandName, platform, end, days);
          if (demoPoints.length > 0) hasDemo = true;
          points.push(...demoPoints);
        }
      }
    }
  }

  return { points, sources: { hasImported: points.some((point) => point.source === "imported"), hasDemo } };
}

export interface PerformanceTotals {
  impressions: number;
  reach: number;
  views: number;
  interactions: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  newFollowers: number;
  conversions: number;
  engagementRate: number;
}

export function aggregateTotals(points: DailyMetricPoint[]): PerformanceTotals {
  const totals = points.reduce(
    (acc, point) => ({
      impressions: acc.impressions + point.impressions,
      reach: acc.reach + point.reach,
      views: acc.views + point.views,
      interactions: acc.interactions + point.interactions,
      reactions: acc.reactions + point.reactions,
      comments: acc.comments + point.comments,
      shares: acc.shares + point.shares,
      saves: acc.saves + point.saves,
      clicks: acc.clicks + point.clicks,
      newFollowers: acc.newFollowers + point.newFollowers,
      conversions: acc.conversions + point.conversions,
    }),
    { impressions: 0, reach: 0, views: 0, interactions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, clicks: 0, newFollowers: 0, conversions: 0 }
  );

  return { ...totals, engagementRate: totals.reach > 0 ? (totals.interactions / totals.reach) * 100 : 0 };
}

export function getPreviousPeriodFilters(filters: PerformanceFilters): PerformanceFilters {
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (days - 1));

  return { ...filters, startDate: toISODate(previousStart), endDate: toISODate(previousEnd) };
}

export type NumericMetricKey = keyof MetricValues;

export function sumByDate(points: DailyMetricPoint[], metric: NumericMetricKey): { date: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const point of points) {
    totals.set(point.date, (totals.get(point.date) ?? 0) + point[metric]);
  }
  return Array.from(totals.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getTopPublications(
  publications: Publication[],
  filters: PerformanceFilters,
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean,
  limit = 5
): PerformedPublication[] {
  return getMatchingPerformedPublications(publications, filters, importedMetrics, demoEnabled)
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit);
}

export function getWorstPublications(
  publications: Publication[],
  filters: PerformanceFilters,
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean,
  limit = 5
): PerformedPublication[] {
  return getMatchingPerformedPublications(publications, filters, importedMetrics, demoEnabled)
    .sort((a, b) => a.engagementRate - b.engagementRate)
    .slice(0, limit);
}

export interface RankedGroup {
  key: string;
  label: string;
  engagementRate: number;
  count: number;
  sources: DataSourceSummary;
}

function rankByKey(performed: PerformedPublication[], getKey: (publication: Publication) => string | null): RankedGroup[] {
  const groups = new Map<string, { reach: number; interactions: number; count: number; sources: DataSourceSummary }>();

  for (const publication of performed) {
    const key = getKey(publication);
    if (key === null) continue;
    const group = groups.get(key) ?? { reach: 0, interactions: 0, count: 0, sources: { hasImported: false, hasDemo: false } };
    group.reach += publication.performance.reach;
    group.interactions += publication.performance.interactions;
    group.count += 1;
    if (publication.performance.source === "imported") group.sources.hasImported = true;
    if (publication.performance.source === "demo") group.sources.hasDemo = true;
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      label: key,
      engagementRate: group.reach > 0 ? (group.interactions / group.reach) * 100 : 0,
      count: group.count,
      sources: group.sources,
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate);
}

function performedFor(
  publications: Publication[],
  filters: PerformanceFilters,
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean
): PerformedPublication[] {
  return getMatchingPerformedPublications(publications, filters, importedMetrics, demoEnabled);
}

export function getPlatformPerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => publication.platform);
}

export function getFormatPerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => publication.format);
}

export function getThemePerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => publication.theme || "Sans thématique");
}

export function getContentTypePerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => publication.contentType ?? null).map(
    (group) => ({ ...group, label: CONTENT_TYPE_LABEL[group.key as ContentType] ?? group.key })
  );
}

export function getObjectivePerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => publication.objective || "Sans objectif");
}

export function getOwnerPerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => publication.owner || "Non assigné");
}

export function getCtaPerformance(publications: Publication[], filters: PerformanceFilters, importedMetrics: ImportedMetricRecord[], demoEnabled: boolean): RankedGroup[] {
  return rankByKey(performedFor(publications, filters, importedMetrics, demoEnabled), (publication) => (publication.cta.trim() ? publication.cta.trim() : null));
}

export interface TimeSlotCell {
  weekday: number;
  weekdayLabel: string;
  slotKey: string;
  slotLabel: string;
  engagementRate: number;
  count: number;
}

export function getBestTimeSlots(
  publications: Publication[],
  filters: PerformanceFilters,
  importedMetrics: ImportedMetricRecord[],
  demoEnabled: boolean
): { grid: TimeSlotCell[]; best: TimeSlotCell | null } {
  const performed = performedFor(publications, filters, importedMetrics, demoEnabled);
  const buckets = new Map<string, { reach: number; interactions: number; count: number; weekday: number; slotKey: string }>();

  for (const publication of performed) {
    const date = new Date(publication.scheduledFor);
    const weekday = date.getDay();
    const slot = getTimeSlot(date.getHours());
    const bucketKey = `${weekday}-${slot.key}`;
    const bucket = buckets.get(bucketKey) ?? { reach: 0, interactions: 0, count: 0, weekday, slotKey: slot.key };
    bucket.reach += publication.performance.reach;
    bucket.interactions += publication.performance.interactions;
    bucket.count += 1;
    buckets.set(bucketKey, bucket);
  }

  const grid: TimeSlotCell[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (const slot of TIME_SLOTS) {
      const bucket = buckets.get(`${weekday}-${slot.key}`);
      grid.push({
        weekday,
        weekdayLabel: WEEKDAY_LABELS[weekday],
        slotKey: slot.key,
        slotLabel: slot.label,
        engagementRate: bucket && bucket.reach > 0 ? (bucket.interactions / bucket.reach) * 100 : 0,
        count: bucket?.count ?? 0,
      });
    }
  }

  const best = grid.filter((cell) => cell.count > 0).sort((a, b) => b.engagementRate - a.engagementRate)[0] ?? null;

  return { grid, best };
}

export const FORMAT_TO_LABEL_KEY: Record<ContentFormat, string> = {
  text: "Texte",
  carousel: "Carrousel",
  image: "Image",
  short_video: "Vidéo courte",
  story: "Story",
  article: "Article ou contenu long",
};

export { PLATFORM_LABEL };
export type { MetricsSource };
