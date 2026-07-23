import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat, Weekday } from "@/types/editorial-calendar";

export type PeriodType = "week" | "month";

export interface IdeaSlot {
  date: string;
  day: Weekday;
  themeLabel: string;
  themeObjective: string;
  platforms: SocialPlatform[];
  formats: ContentFormat[];
}

export interface ContentIdea {
  id: string;
  slot: IdeaSlot;
  variantSeed: number;
  subject: string;
  angle: string;
  objective: string;
  platform: SocialPlatform;
  format: ContentFormat;
  cta: string;
}
