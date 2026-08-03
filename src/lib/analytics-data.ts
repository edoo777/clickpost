import { toISODate } from "@/lib/date-utils";
import type { DailyMetricPoint, MetricValues, PublicationPerformance } from "@/types/analytics";
import type { SocialPlatform } from "@/types/dashboard";

/** Données de démonstration uniquement — jamais affichées sans activation explicite (voir
 * src/lib/demo-data-preference.ts). Toutes les valeurs renvoyées portent `source: "demo"`. */
export const DEMO_PUBLICATION_PERFORMANCE: Record<string, PublicationPerformance> = {
  "post-1": buildDemoPerformance("post-1", 3200, 2600, 140, 45, 6),
  "post-4": buildDemoPerformance("post-4", 1800, 1500, 95, 20, 3),
  "post-5": buildDemoPerformance("post-5", 4100, 3400, 260, 80, 9),
  "post-7": buildDemoPerformance("post-7", 8200, 6900, 720, 210, 34),
  "post-9": buildDemoPerformance("post-9", 2600, 2100, 180, 30, 5),
  "post-10": buildDemoPerformance("post-10", 2100, 1900, 75, 25, 2),
  "post-11": buildDemoPerformance("post-11", 7400, 6100, 540, 260, 22),
  "post-15": buildDemoPerformance("post-15", 2000, 1650, 110, 18, 4),
  "post-16": buildDemoPerformance("post-16", 2300, 2050, 88, 30, 3),
  "post-18": buildDemoPerformance("post-18", 12500, 10800, 1450, 190, 68),
  "post-19": buildDemoPerformance("post-19", 2900, 2400, 130, 40, 5),
  "post-20": buildDemoPerformance("post-20", 9100, 7600, 890, 240, 41),
};

function buildDemoPerformance(
  publicationId: string,
  impressions: number,
  reach: number,
  interactions: number,
  clicks: number,
  newFollowers: number
): PublicationPerformance {
  const seed = hashString(publicationId);
  return {
    publicationId,
    impressions,
    reach,
    views: Math.round(impressions * (0.4 + (seed % 20) / 100)),
    interactions,
    reactions: Math.round(interactions * 0.7),
    comments: Math.round(interactions * 0.15),
    shares: Math.round(interactions * 0.1),
    saves: Math.round(interactions * 0.05),
    clicks,
    newFollowers,
    conversions: Math.round(clicks * 0.08),
    source: "demo",
  };
}

const BRAND_BASE_IMPRESSIONS: Partial<Record<string, Partial<Record<SocialPlatform, [number, number]>>>> = {
  "Nova Cosmetics": { instagram: [1800, 2600], tiktok: [2200, 3400] },
  "Atlas Consulting": { linkedin: [700, 1100], x: [500, 800] },
  "Le Comptoir Bio": { facebook: [500, 900] },
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRange(seed: string, min: number, max: number): number {
  return min + (hashString(seed) % (max - min + 1));
}

function buildMetrics(seedBase: string, impressions: number): MetricValues {
  const reach = Math.round(impressions * (0.65 + seededRange(`${seedBase}-reach`, 0, 15) / 100));
  const interactions = Math.round(reach * (0.03 + seededRange(`${seedBase}-eng`, 0, 6) / 100));
  const clicks = Math.round(impressions * (0.005 + seededRange(`${seedBase}-clicks`, 0, 15) / 1000));
  return {
    impressions,
    reach,
    views: Math.round(impressions * (0.4 + seededRange(`${seedBase}-views`, 0, 20) / 100)),
    interactions,
    reactions: Math.round(interactions * 0.7),
    comments: Math.round(interactions * 0.15),
    shares: Math.round(interactions * 0.1),
    saves: Math.round(interactions * 0.05),
    clicks,
    newFollowers: seededRange(`${seedBase}-followers`, 0, 12),
    conversions: Math.round(clicks * 0.08),
  };
}

/** Uniquement appelée quand la démonstration est explicitement activée (voir
 * demo-data-preference.ts) — jamais par défaut. Retourne `[]` pour toute marque hors des trois
 * marques de démonstration (aucune collision de nom possible avec de vraies données : ce garde-
 * fou existait déjà, mais l'appel est désormais conditionné explicitement en amont, pas implicite). */
export function generateDailySeries(brand: string, platform: SocialPlatform, endDate: Date, days: number): DailyMetricPoint[] {
  const range = BRAND_BASE_IMPRESSIONS[brand]?.[platform];
  if (!range) return [];

  const [min, max] = range;
  const weekendBoost = brand !== "Atlas Consulting";
  const points: DailyMetricPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - offset);
    const isoDate = toISODate(date);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const weekendFactor = isWeekend ? (weekendBoost ? 1.1 : 0.65) : 1;

    const seedBase = `${brand}-${platform}-${isoDate}`;
    const impressions = Math.round(seededRange(`${seedBase}-impressions`, min, max) * weekendFactor);

    points.push({ date: isoDate, brand, platform, source: "demo", ...buildMetrics(seedBase, impressions) });
  }

  return points;
}
