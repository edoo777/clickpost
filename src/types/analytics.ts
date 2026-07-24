import type { SocialPlatform } from "@/types/dashboard";

export interface PublicationPerformance {
  publicationId: string;
  impressions: number;
  reach: number;
  interactions: number;
  clicks: number;
  newFollowers: number;
}

export interface DailyMetricPoint {
  date: string;
  brand: string;
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  interactions: number;
  clicks: number;
  newFollowers: number;
}
