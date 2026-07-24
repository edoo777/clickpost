export type SocialPlatform = "instagram" | "facebook" | "linkedin" | "tiktok" | "x";

export type AccountStatus = "connected" | "reconnect_needed";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  brand: string;
  handle: string;
  status: AccountStatus;
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  change: number;
}
