import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export type PublicationStatus =
  | "idea"
  | "draft"
  | "in_production"
  | "in_review"
  | "pending_client"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export interface PublicationMedia {
  id: string;
  type: "image" | "video";
  label: string;
}

export interface Publication {
  id: string;
  brand: string;
  accountId: string;
  platform: SocialPlatform;
  scheduledFor: string;
  timeZone: string;
  theme: string;
  format: ContentFormat;
  objective: string;
  excerpt: string;
  text: string;
  cta: string;
  hashtags: string[];
  firstComment: string;
  media: PublicationMedia[];
  status: PublicationStatus;
  owner: string;
  approver: string;
  internalNotes: string;
}
