import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { PublishAttempt } from "@/types/publishing-provider";

export type PublicationStatus =
  | "idea"
  | "to_develop"
  | "content_generated"
  | "draft"
  | "in_production"
  | "in_review"
  | "needs_changes"
  | "pending_client"
  | "approved"
  | "ready_to_schedule"
  | "scheduled"
  | "published"
  | "failed"
  | "rejected"
  | "archived";

export type ContentPriority = "low" | "medium" | "high";

export type ContentSource = "manual" | "generated";

export interface PublicationMedia {
  id: string;
  type: "image" | "video";
  label: string;
  /** URL signée temporaire, résolue à l'affichage — jamais stockée telle quelle en base (le
   * bucket est privé). Absente tant qu'aucun fichier réel n'a été téléversé. */
  url?: string;
  /** Chemin réel dans Supabase Storage (workspaceId/brandId/publicationId/mediaId-filename.ext)
   * — source de vérité pour régénérer une URL signée ou supprimer le fichier. */
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  /** Ordre d'affichage explicite (glisser-déposer) — absent = ordre du tableau. */
  order?: number;
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
  /** Historique des tentatives de publication réelles (manuelles ou automatiques) — absent tant
   * qu'aucune tentative n'a eu lieu. Jamais une tentative "success" sans action humaine confirmée
   * (mode manuel) ou sans appel réseau réel abouti (mode automatique, non disponible aujourd'hui). */
  publishAttempts?: PublishAttempt[];
  source?: ContentSource;
  createdAt?: string;
  updatedAt?: string;
  linkedPublicationId?: string;
  ideaId?: string;
}
