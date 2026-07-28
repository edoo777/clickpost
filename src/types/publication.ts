import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export type PublicationStatus =
  | "idea"
  | "to_develop"
  | "content_generated"
  | "draft"
  | "in_production"
  | "in_review"
  | "pending_client"
  | "approved"
  | "ready_to_schedule"
  | "scheduled"
  | "published"
  | "failed"
  | "rejected";

export type ContentPriority = "low" | "medium" | "high";

export type ContentSource = "manual" | "generated";

export interface PublicationMedia {
  id: string;
  type: "image" | "video";
  label: string;
}

export interface PublicationComment {
  id: string;
  authorName: string;
  audience: "internal" | "client";
  text: string;
  createdAt: string;
}

export interface PublicationHistoryEntry {
  id: string;
  action: string;
  actorName: string;
  createdAt: string;
  note?: string;
}

export interface Publication {
  id: string;
  brand: string;
  accountId: string;
  platform: SocialPlatform;
  scheduledFor: string;
  timeZone: string;
  theme: string;
  themeId?: string;
  format: ContentFormat;
  objective: string;
  angle?: string;
  excerpt: string;
  text: string;
  cta: string;
  hashtags: string[];
  firstComment: string;
  media: PublicationMedia[];
  status: PublicationStatus;
  priority?: ContentPriority;
  dueDate?: string;
  owner: string;
  approver: string;
  campaignId?: string;
  internalNotes: string;
  comments: PublicationComment[];
  history: PublicationHistoryEntry[];
  source?: ContentSource;
  createdAt?: string;
  updatedAt?: string;
  linkedPublicationId?: string;
  ideaId?: string;
}
