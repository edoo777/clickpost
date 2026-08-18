import type { Publication, PublicationHistoryEntry } from "@/types/publication";

export interface ApprovalFilters {
  brand: string | "all";
  owner: string | "all";
  approver: string | "all";
  status: "in_review" | "pending_client" | "all";
}

export const DEFAULT_APPROVAL_FILTERS: ApprovalFilters = {
  brand: "all",
  owner: "all",
  approver: "all",
  status: "all",
};

export function getApprovalQueue(publications: Publication[], filters: ApprovalFilters): Publication[] {
  return publications
    .filter((publication) => publication.status === "in_review" || publication.status === "pending_client")
    .filter((publication) => {
      if (filters.status !== "all" && publication.status !== filters.status) return false;
      if (filters.brand !== "all" && publication.brand !== filters.brand) return false;
      if (filters.owner !== "all" && publication.owner !== filters.owner) return false;
      if (filters.approver !== "all" && publication.approver !== filters.approver) return false;
      return true;
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

export function getNextActor(publication: Publication): string | null {
  switch (publication.status) {
    case "in_production":
    case "needs_changes":
      return publication.owner || null;
    case "in_review":
    case "pending_client":
      return publication.approver || null;
    default:
      return null;
  }
}

/** Champs dont la modification, sur une publication déjà approuvée, doit la remettre en revue —
 * jamais un écrasement silencieux d'un contenu déjà validé (métadonnées de suivi comme
 * `internalNotes`/`owner`/`priority` sont volontairement exclues : elles ne changent pas ce qui a
 * été approuvé). */
export function hasApprovedContentChanged(previous: Publication, updated: Publication): boolean {
  if (previous.text !== updated.text) return true;
  if (previous.excerpt !== updated.excerpt) return true;
  if (previous.cta !== updated.cta) return true;
  if (previous.firstComment !== updated.firstComment) return true;
  if (previous.scheduledFor !== updated.scheduledFor) return true;
  if (previous.platform !== updated.platform) return true;
  if (previous.format !== updated.format) return true;
  if (JSON.stringify(previous.hashtags) !== JSON.stringify(updated.hashtags)) return true;
  const previousMediaIds = previous.media.map((item) => item.id).join(",");
  const updatedMediaIds = updated.media.map((item) => item.id).join(",");
  if (previousMediaIds !== updatedMediaIds) return true;
  return false;
}

function appendHistory(publication: Publication, action: string, actorName: string, note?: string): Publication {
  const entry: PublicationHistoryEntry = {
    id: crypto.randomUUID(),
    action,
    actorName,
    createdAt: new Date().toISOString(),
    ...(note ? { note } : {}),
  };
  return { ...publication, history: [...publication.history, entry] };
}

export function approvePublication(publication: Publication, actorName: string): Publication {
  return appendHistory({ ...publication, status: "approved" }, "Approuvée", actorName);
}

/** Fait passer une publication tout juste approuvée directement à "ready_to_schedule" ou
 * "scheduled" selon `postApprovalBehavior` (réglages d'équipe, voir WorkflowSection.tsx) — un
 * second changement d'état délibéré (jamais fusionné dans `approvePublication`) pour que le
 * verrou de transition en base (`publications_check_status_transition`, qui exige "approved" comme
 * état intermédiaire avant "scheduled") reste satisfait, et que l'historique garde une entrée
 * distincte pour chaque étape réelle. */
export function applyPostApprovalBehavior(
  publication: Publication,
  actorName: string,
  postApprovalBehavior: "ready_to_schedule" | "scheduled"
): Publication {
  if (postApprovalBehavior === "ready_to_schedule") {
    return appendHistory({ ...publication, status: "ready_to_schedule" }, "Prête à programmer", actorName);
  }
  return appendHistory({ ...publication, status: "scheduled" }, "Programmée", actorName);
}

export function requestChanges(publication: Publication, note: string, actorName: string): Publication {
  const withComment: Publication = {
    ...publication,
    status: "needs_changes",
    comments: [
      ...publication.comments,
      {
        id: crypto.randomUUID(),
        authorName: actorName,
        audience: "internal",
        text: note,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  return appendHistory(withComment, "Modifications demandées", actorName, note);
}

export function rejectPublication(publication: Publication, reason: string, actorName: string): Publication {
  const withComment: Publication = {
    ...publication,
    status: "rejected",
    comments: [
      ...publication.comments,
      {
        id: crypto.randomUUID(),
        authorName: actorName,
        audience: "internal",
        text: reason,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  return appendHistory(withComment, "Refusée", actorName, reason);
}
