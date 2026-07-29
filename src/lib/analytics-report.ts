import { PUBLICATION_PERFORMANCE, generateDailySeries } from "@/lib/analytics-data";
import { toISODate } from "@/lib/date-utils";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { Brand } from "@/types/brand";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { DailyMetricPoint, PublicationPerformance } from "@/types/analytics";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Publication } from "@/types/publication";

export interface PerformanceFilters {
  brand: string | "all";
  accountId: string | "all";
  platform: SocialPlatform | "all";
  startDate: string;
  endDate: string;
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

export function getDailySeries(
  filters: PerformanceFilters,
  accounts: SocialAccount[],
  brands: Brand[]
): DailyMetricPoint[] {
  const brandNames = filters.brand === "all" ? brands.map((brand) => brand.name) : [filters.brand];
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days <= 0) return [];

  const points: DailyMetricPoint[] = [];

  for (const brandName of brandNames) {
    const brandProfile = brands.find((brand) => brand.name === brandName);
    if (!brandProfile) continue;

    let platforms: SocialPlatform[] = brandProfile.socialPlatforms;
    if (filters.platform !== "all") {
      platforms = platforms.filter((platform) => platform === filters.platform);
    }
    if (filters.accountId !== "all") {
      const account = accounts.find((candidate) => candidate.id === filters.accountId);
      platforms = account ? platforms.filter((platform) => platform === account.platform) : [];
    }

    for (const platform of platforms) {
      points.push(...generateDailySeries(brandName, platform, end, days));
    }
  }

  return points;
}

export interface PerformanceTotals {
  impressions: number;
  reach: number;
  interactions: number;
  clicks: number;
  newFollowers: number;
  engagementRate: number;
}

export function aggregateTotals(points: DailyMetricPoint[]): PerformanceTotals {
  const totals = points.reduce(
    (acc, point) => ({
      impressions: acc.impressions + point.impressions,
      reach: acc.reach + point.reach,
      interactions: acc.interactions + point.interactions,
      clicks: acc.clicks + point.clicks,
      newFollowers: acc.newFollowers + point.newFollowers,
    }),
    { impressions: 0, reach: 0, interactions: 0, clicks: 0, newFollowers: 0 }
  );

  return {
    ...totals,
    engagementRate: totals.reach > 0 ? (totals.interactions / totals.reach) * 100 : 0,
  };
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

export type NumericMetricKey = "impressions" | "reach" | "interactions" | "clicks" | "newFollowers";

export function sumByDate(points: DailyMetricPoint[], metric: NumericMetricKey): { date: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const point of points) {
    totals.set(point.date, (totals.get(point.date) ?? 0) + point[metric]);
  }
  return Array.from(totals.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function matchesFilters(publication: Publication, filters: PerformanceFilters): boolean {
  if (filters.brand !== "all" && publication.brand !== filters.brand) return false;
  if (filters.platform !== "all" && publication.platform !== filters.platform) return false;
  if (filters.accountId !== "all" && publication.accountId !== filters.accountId) return false;
  const date = publication.scheduledFor.slice(0, 10);
  if (date < filters.startDate || date > filters.endDate) return false;
  return true;
}

export function getMatchingPerformedPublications(
  publications: Publication[],
  filters: PerformanceFilters
): Array<Publication & { performance: PublicationPerformance; engagementRate: number }> {
  return publications
    .filter((publication) => matchesFilters(publication, filters))
    .map((publication) => {
      const performance = PUBLICATION_PERFORMANCE[publication.id];
      if (!performance) return null;
      const engagementRate = performance.reach > 0 ? (performance.interactions / performance.reach) * 100 : 0;
      return { ...publication, performance, engagementRate };
    })
    .filter((value): value is Publication & { performance: PublicationPerformance; engagementRate: number } =>
      value !== null
    );
}

export function getPublishedCount(publications: Publication[], filters: PerformanceFilters): number {
  return getMatchingPerformedPublications(publications, filters).length;
}

export function getTopPublications(publications: Publication[], filters: PerformanceFilters, limit = 5) {
  return getMatchingPerformedPublications(publications, filters)
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit);
}

interface RankedGroup {
  key: string;
  label: string;
  engagementRate: number;
  count: number;
}

function rankByKey(
  performed: ReturnType<typeof getMatchingPerformedPublications>,
  getKey: (publication: Publication) => string
): RankedGroup[] {
  const groups = new Map<string, { reach: number; interactions: number; count: number }>();

  for (const publication of performed) {
    const key = getKey(publication);
    const group = groups.get(key) ?? { reach: 0, interactions: 0, count: 0 };
    group.reach += publication.performance.reach;
    group.interactions += publication.performance.interactions;
    group.count += 1;
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      label: key,
      engagementRate: group.reach > 0 ? (group.interactions / group.reach) * 100 : 0,
      count: group.count,
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate);
}

export function getPlatformPerformance(publications: Publication[], filters: PerformanceFilters): RankedGroup[] {
  const performed = getMatchingPerformedPublications(publications, filters);
  return rankByKey(performed, (publication) => publication.platform);
}

export function getFormatPerformance(publications: Publication[], filters: PerformanceFilters): RankedGroup[] {
  const performed = getMatchingPerformedPublications(publications, filters);
  return rankByKey(performed, (publication) => publication.format);
}

export function getThemePerformance(publications: Publication[], filters: PerformanceFilters): RankedGroup[] {
  const performed = getMatchingPerformedPublications(publications, filters);
  return rankByKey(performed, (publication) => publication.theme || "Sans thématique");
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
  filters: PerformanceFilters
): { grid: TimeSlotCell[]; best: TimeSlotCell | null } {
  const performed = getMatchingPerformedPublications(publications, filters);
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

  const best = grid
    .filter((cell) => cell.count > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate)[0] ?? null;

  return { grid, best };
}

const FORMAT_TO_LABEL_KEY: Record<ContentFormat, string> = {
  text: "Texte",
  carousel: "Carrousel",
  image: "Image",
  short_video: "Vidéo courte",
  story: "Story",
  article: "Article ou contenu long",
};

export interface RecommendationInput {
  topFormat: RankedGroup | null;
  topPlatform: RankedGroup | null;
  topTheme: RankedGroup | null;
  bestTimeSlot: TimeSlotCell | null;
  currentTotals: PerformanceTotals;
  previousTotals: PerformanceTotals | null;
}

export function generateRecommendations(input: RecommendationInput): string[] {
  const recommendations: string[] = [];

  if (input.topFormat) {
    const label = FORMAT_TO_LABEL_KEY[input.topFormat.key as ContentFormat] ?? input.topFormat.key;
    recommendations.push(
      `Le format "${label}" génère le meilleur taux d'engagement (${input.topFormat.engagementRate.toFixed(1)}%) sur la période — privilégiez-le dans vos prochaines publications.`
    );
  }

  if (input.topTheme) {
    recommendations.push(
      `La thématique "${input.topTheme.label}" surperforme (${input.topTheme.engagementRate.toFixed(1)}% d'engagement) — envisagez d'en publier davantage.`
    );
  }

  if (input.topPlatform) {
    const platformLabel =
      PLATFORM_LABEL[input.topPlatform.key as SocialPlatform] ?? input.topPlatform.label;
    recommendations.push(
      `${platformLabel} est le réseau le plus engageant sur la période (${input.topPlatform.engagementRate.toFixed(1)}%).`
    );
  }

  if (input.bestTimeSlot) {
    recommendations.push(
      `Les publications du ${input.bestTimeSlot.weekdayLabel.toLowerCase()} en créneau "${input.bestTimeSlot.slotLabel.toLowerCase()}" obtiennent le meilleur engagement moyen — un bon créneau à privilégier.`
    );
  }

  if (input.previousTotals) {
    const delta = input.currentTotals.engagementRate - input.previousTotals.engagementRate;
    if (Math.abs(delta) >= 0.1) {
      const direction = delta > 0 ? "en hausse" : "en baisse";
      recommendations.push(
        `Le taux d'engagement global est ${direction} de ${Math.abs(delta).toFixed(1)} point${Math.abs(delta) >= 2 ? "s" : ""} par rapport à la période précédente.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Pas assez de données sur cette période pour générer des recommandations.");
  }

  return recommendations;
}
