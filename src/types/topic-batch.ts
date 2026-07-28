import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export type TopicBatchStatus = "draft" | "generated" | "partially_saved" | "completed" | "archived";

export type TopicVarietyLevel = "low" | "medium" | "high";

export interface TopicBatch {
  id: string;
  brandId: string;
  themeId: string;
  name: string;
  requestedCount: number;
  generatedCount: number;
  selectedCount: number;
  targetAudience?: string;
  objective?: string;
  platforms: SocialPlatform[];
  formats: ContentFormat[];
  instructions?: string;
  varietyLevel?: TopicVarietyLevel;
  status: TopicBatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  batchId: string;
  label: string;
  selected: boolean;
  locked: boolean;
  duplicateOfId?: string;
}
