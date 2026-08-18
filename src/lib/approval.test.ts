import { describe, expect, it } from "vitest";
import { applyPostApprovalBehavior, approvePublication, requestChanges, rejectPublication } from "@/lib/approval";
import type { Publication } from "@/types/publication";

function fixturePublication(overrides: Partial<Publication> = {}): Publication {
  return {
    id: "pub-1",
    brand: "Acme",
    accountId: "acc-1",
    platform: "linkedin",
    scheduledFor: "2026-08-20T09:00:00.000Z",
    timeZone: "Europe/Paris",
    theme: "Conseils",
    format: "text",
    objective: "",
    excerpt: "",
    text: "",
    cta: "",
    hashtags: [],
    firstComment: "",
    media: [],
    status: "in_review",
    owner: "Camille",
    approver: "Édouard",
    internalNotes: "",
    comments: [],
    history: [],
    ...overrides,
  };
}

describe("approvePublication", () => {
  it("always lands on the approved status, regardless of the post-approval setting", () => {
    const updated = approvePublication(fixturePublication(), "Édouard");
    expect(updated.status).toBe("approved");
    expect(updated.history.at(-1)).toMatchObject({ action: "Approuvée", actorName: "Édouard" });
  });
});

describe("applyPostApprovalBehavior", () => {
  it('moves an approved publication to "ready_to_schedule" by default', () => {
    const approved = fixturePublication({ status: "approved" });
    const updated = applyPostApprovalBehavior(approved, "Édouard", "ready_to_schedule");
    expect(updated.status).toBe("ready_to_schedule");
    expect(updated.history.at(-1)).toMatchObject({ action: "Prête à programmer" });
  });

  it('moves an approved publication straight to "scheduled" when configured', () => {
    const approved = fixturePublication({ status: "approved" });
    const updated = applyPostApprovalBehavior(approved, "Édouard", "scheduled");
    expect(updated.status).toBe("scheduled");
    expect(updated.history.at(-1)).toMatchObject({ action: "Programmée" });
  });
});

describe("requestChanges / rejectPublication", () => {
  it("records a comment and a history entry when changes are requested", () => {
    const updated = requestChanges(fixturePublication(), "Manque un CTA", "Julien");
    expect(updated.status).toBe("needs_changes");
    expect(updated.comments.at(-1)).toMatchObject({ text: "Manque un CTA", authorName: "Julien" });
    expect(updated.history.at(-1)).toMatchObject({ action: "Modifications demandées", note: "Manque un CTA" });
  });

  it("records a comment and a history entry when a publication is rejected", () => {
    const updated = rejectPublication(fixturePublication(), "Hors ligne éditoriale", "Julien");
    expect(updated.status).toBe("rejected");
    expect(updated.comments.at(-1)).toMatchObject({ text: "Hors ligne éditoriale" });
    expect(updated.history.at(-1)).toMatchObject({ action: "Refusée" });
  });
});
