export type SocialPlatform = "instagram" | "facebook" | "linkedin" | "tiktok" | "x";

export type AccountStatus = "connected" | "reconnect_needed";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  brand: string;
  handle: string;
  status: AccountStatus;
}

export type PostStatus = "scheduled" | "draft" | "pending_approval";

export interface ScheduledPost {
  id: string;
  platform: SocialPlatform;
  brand: string;
  excerpt: string;
  scheduledFor: string;
  status: PostStatus;
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  change: number;
}
