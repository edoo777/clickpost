import type { SocialPlatform } from "@/types/dashboard";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ContentFormat = "text" | "carousel" | "image" | "short_video" | "story" | "article";

export interface EditorialDayPlan {
  day: Weekday;
  enabled: boolean;
  themeIds: string[];
  platforms: SocialPlatform[];
  formats: ContentFormat[];
  frequency: number;
}

export interface EditorialWeekPlan {
  id: string;
  label: string;
  days: EditorialDayPlan[];
}

export interface BrandEditorialCalendar {
  brandId: string;
  weekPlans: EditorialWeekPlan[];
}
