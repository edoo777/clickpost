import { toISODate } from "@/lib/idea-generator";
import type { SocialPlatform } from "@/types/dashboard";
import type { DailyMetricPoint, PublicationPerformance } from "@/types/analytics";

export const PUBLICATION_PERFORMANCE: Record<string, PublicationPerformance> = {
  "post-1": { publicationId: "post-1", impressions: 3200, reach: 2600, interactions: 140, clicks: 45, newFollowers: 6 },
  "post-4": { publicationId: "post-4", impressions: 1800, reach: 1500, interactions: 95, clicks: 20, newFollowers: 3 },
  "post-5": { publicationId: "post-5", impressions: 4100, reach: 3400, interactions: 260, clicks: 80, newFollowers: 9 },
  "post-7": { publicationId: "post-7", impressions: 8200, reach: 6900, interactions: 720, clicks: 210, newFollowers: 34 },
  "post-9": { publicationId: "post-9", impressions: 2600, reach: 2100, interactions: 180, clicks: 30, newFollowers: 5 },
  "post-10": { publicationId: "post-10", impressions: 2100, reach: 1900, interactions: 75, clicks: 25, newFollowers: 2 },
  "post-11": { publicationId: "post-11", impressions: 7400, reach: 6100, interactions: 540, clicks: 260, newFollowers: 22 },
  "post-15": { publicationId: "post-15", impressions: 2000, reach: 1650, interactions: 110, clicks: 18, newFollowers: 4 },
  "post-16": { publicationId: "post-16", impressions: 2300, reach: 2050, interactions: 88, clicks: 30, newFollowers: 3 },
  "post-18": { publicationId: "post-18", impressions: 12500, reach: 10800, interactions: 1450, clicks: 190, newFollowers: 68 },
  "post-19": { publicationId: "post-19", impressions: 2900, reach: 2400, interactions: 130, clicks: 40, newFollowers: 5 },
  "post-20": { publicationId: "post-20", impressions: 9100, reach: 7600, interactions: 890, clicks: 240, newFollowers: 41 },
};

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

export function generateDailySeries(
  brand: string,
  platform: SocialPlatform,
  endDate: Date,
  days: number
): DailyMetricPoint[] {
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
    const reach = Math.round(impressions * (0.65 + seededRange(`${seedBase}-reach`, 0, 15) / 100));
    const interactions = Math.round(reach * (0.03 + seededRange(`${seedBase}-eng`, 0, 6) / 100));
    const clicks = Math.round(impressions * (0.005 + seededRange(`${seedBase}-clicks`, 0, 15) / 1000));
    const newFollowers = seededRange(`${seedBase}-followers`, 0, 12);

    points.push({ date: isoDate, brand, platform, impressions, reach, interactions, clicks, newFollowers });
  }

  return points;
}
