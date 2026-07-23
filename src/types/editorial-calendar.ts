import type { SocialPlatform } from "@/types/dashboard";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ContentFormat = "text" | "carousel" | "image" | "short_video" | "story";

export interface EditorialTheme {
  id: string;
  label: string;
  objective: string;
}

export interface EditorialDayPlan {
  day: Weekday;
  enabled: boolean;
  themes: EditorialTheme[];
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
