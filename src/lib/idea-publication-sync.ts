import type { IdeaStatus } from "@/types/idea";
import type { PublicationStatus } from "@/types/publication";

export const SYNC_ACTOR_NAME = "Synchronisation automatique";

const IDEA_TO_PUBLICATION_STATUS: Partial<Record<IdeaStatus, PublicationStatus>> = {
  idea: "idea",
  to_develop: "to_develop",
  reflecting: "draft",
  plan_ready: "draft",
  drafting: "draft",
  content_generated: "content_generated",
  draft: "draft",
  in_review: "in_review",
  approved: "approved",
  ready_to_schedule: "ready_to_schedule",
  scheduled: "scheduled",
  published: "published",
  needs_changes: "needs_changes",
  failed: "failed",
  // blocked, archived : aucun équivalent pertinent côté publication — pas de propagation automatique.
};

const PUBLICATION_TO_IDEA_STATUS: Partial<Record<PublicationStatus, IdeaStatus>> = {
  idea: "idea",
  to_develop: "to_develop",
  content_generated: "content_generated",
  draft: "draft",
  in_production: "needs_changes",
  in_review: "in_review",
  needs_changes: "needs_changes",
  pending_client: "in_review",
  approved: "approved",
  ready_to_schedule: "ready_to_schedule",
  scheduled: "scheduled",
  published: "published",
  failed: "failed",
  rejected: "needs_changes",
};

/** `undefined` signifie explicitement « ne rien propager », jamais une erreur. */
export function mapIdeaStatusToPublicationStatus(status: IdeaStatus): PublicationStatus | undefined {
  return IDEA_TO_PUBLICATION_STATUS[status];
}

/** `undefined` signifie explicitement « ne rien propager », jamais une erreur. */
export function mapPublicationStatusToIdeaStatus(status: PublicationStatus): IdeaStatus | undefined {
  return PUBLICATION_TO_IDEA_STATUS[status];
}
