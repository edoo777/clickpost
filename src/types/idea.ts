import type { GenerationTone } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { ContentPriority, ContentSource, PublicationMedia } from "@/types/publication";
import type { RichDocument } from "@/types/rich-document";

export type IdeaStatus =
  | "idea"
  | "to_develop"
  | "reflecting"
  | "plan_ready"
  | "drafting"
  | "content_generated"
  | "draft"
  | "in_review"
  | "approved"
  | "ready_to_schedule"
  | "scheduled"
  | "published"
  | "blocked"
  | "needs_changes"
  | "failed"
  | "archived";

export interface Idea {
  id: string;
  brandId: string;
  themeId?: string;
  batchId?: string;
  campaignId?: string;
  title: string;
  description?: string;
  angle?: string;
  objective?: string;
  targetAudience?: string;
  source: ContentSource;
  priority?: ContentPriority;
  platform?: SocialPlatform;
  format?: ContentFormat;
  scheduledFor?: string;
  dueDate?: string;
  owner?: string;
  approver?: string;
  quickNotes?: string;
  status: IdeaStatus;
  workflowStageId?: string;
  createdAt: string;
  updatedAt: string;
  publicationId?: string;
  hook?: string;
  personalNotes?: string;
  references?: string[];
  keyPoints?: string[];
  contentPlan?: string;
  body?: string;
  conclusion?: string;
  cta?: string;
  hashtags?: string[];
  firstComment?: string;
  media?: PublicationMedia[];
  internalNotes?: string;
  activeVersionId?: string;
  /** Corps riche de l'Atelier de contenu (document Tiptap) — source du miroir texte `body`. */
  documentContent?: RichDocument;
  /** Dernier mode d'affichage utilisé dans l'Atelier ; n'efface jamais le contenu au changement. */
  workshopDisplayMode?: "document" | "structured";
  /** Ton éditorial préféré pour cette idée (affiché en propriété, préselectionne la catégorie « Ton »). */
  tone?: GenerationTone;
}
