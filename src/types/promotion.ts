/**
 * Checklist de promotion post-publication — huit actions fixes, rattachées directement à une
 * publication (Publication.promotionTasks), jamais un système de suivi séparé. Voir
 * src/lib/promotion.ts pour les libellés, l'ordre d'affichage et les calculs de progression.
 */
export type PromotionTaskType =
  | "repost_story"
  | "share_community"
  | "reply_comments"
  | "partner_mention"
  | "team_share_request"
  | "recycle_format"
  | "follow_up"
  | "paid_boost";

export type PromotionTaskStatus = "todo" | "in_progress" | "done" | "skipped";

export interface PromotionTask {
  id: string;
  type: PromotionTaskType;
  owner: string;
  dueDate?: string;
  status: PromotionTaskStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
