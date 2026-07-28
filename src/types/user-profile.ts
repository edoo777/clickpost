import type { NotificationKey } from "@/types/settings";

export type DisplayDensity = "comfortable" | "compact";
export type DisplayTheme = "system" | "light" | "dark";

export interface UserProfileExtra {
  memberId: string;
  firstName: string;
  lastName: string;
  company: string;
  timeZone: string;
  language: string;
  country: string;
  phone: string;
  bio: string;
  notifications: Record<NotificationKey, boolean>;
  displayDensity: DisplayDensity;
  theme: DisplayTheme;
}
