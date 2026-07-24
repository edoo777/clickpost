export type SocialPlatform = "instagram" | "facebook" | "linkedin" | "tiktok" | "x" | "youtube";

export type AccountStatus = "connected" | "disconnected" | "expired" | "error" | "syncing";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  brand: string;
  accountName: string;
  handle: string;
  status: AccountStatus;
  lastSyncedAt: string | null;
  permissions: string[];
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  change: number;
}
