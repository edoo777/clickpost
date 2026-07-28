import type { IdeaStatus } from "@/types/idea";

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  idea: "Idée",
  to_develop: "À développer",
  reflecting: "En réflexion",
  plan_ready: "Plan préparé",
  drafting: "Rédaction en cours",
  content_generated: "Contenu généré",
  draft: "Brouillon",
  in_review: "En révision",
  approved: "Approuvé",
  ready_to_schedule: "Prêt à planifier",
  scheduled: "Planifié",
  published: "Publié",
  blocked: "Bloqué",
  needs_changes: "À corriger",
  failed: "Échec",
  archived: "Archivé",
};

export const IDEA_STATUS_ORDER: IdeaStatus[] = [
  "idea",
  "to_develop",
  "reflecting",
  "plan_ready",
  "drafting",
  "content_generated",
  "draft",
  "in_review",
  "approved",
  "ready_to_schedule",
  "scheduled",
  "published",
  "blocked",
  "needs_changes",
  "failed",
  "archived",
];

export const IDEA_TERMINAL_STATUSES: IdeaStatus[] = ["published", "archived"];

export const IDEA_ACTIVE_STATUSES: IdeaStatus[] = IDEA_STATUS_ORDER.filter(
  (status) => !IDEA_TERMINAL_STATUSES.includes(status)
);

export function getIdeaStatusLabel(status: IdeaStatus): string {
  return IDEA_STATUS_LABEL[status];
}

export function isIdeaTerminalStatus(status: IdeaStatus): boolean {
  return IDEA_TERMINAL_STATUSES.includes(status);
}

export function isIdeaActiveStatus(status: IdeaStatus): boolean {
  return IDEA_ACTIVE_STATUSES.includes(status);
}
