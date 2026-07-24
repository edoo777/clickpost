import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { PublicationStatus } from "@/types/publication";

export interface AgencyInfo {
  name: string;
  logoLabel: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  defaultLanguage: string;
  defaultTimeZone: string;
}

export interface BrandIdentity {
  primaryColor: string;
  secondaryColor: string;
}

export interface ContentPreferences {
  defaultCreationLanguage: string;
  defaultPlatforms: SocialPlatform[];
  favoriteFormats: ContentFormat[];
  defaultCampaignDurationDays: number;
  recurringHashtags: string[];
  recurringCtas: string[];
}

export interface ApprovalWorkflowSettings {
  initialStatus: PublicationStatus;
  internalApprovalRequired: boolean;
  clientApprovalRequired: boolean;
  defaultOwnerId: string;
  defaultApproverId: string;
  postApprovalBehavior: "ready_to_schedule" | "scheduled";
}

export type NotificationKey =
  | "new_to_review"
  | "change_requests"
  | "approvals_received"
  | "expired_connections"
  | "publish_failures"
  | "weekly_summary";

export interface AgencySettings {
  info: AgencyInfo;
  identity: BrandIdentity;
  content: ContentPreferences;
  workflow: ApprovalWorkflowSettings;
  notifications: Record<NotificationKey, boolean>;
}
