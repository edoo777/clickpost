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
      return publication.owner || null;
    case "in_review":
    case "pending_client":
      return publication.approver || null;
    default:
      return null;
  }
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

export function requestChanges(publication: Publication, note: string, actorName: string): Publication {
  const withComment: Publication = {
    ...publication,
    status: "in_production",
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
