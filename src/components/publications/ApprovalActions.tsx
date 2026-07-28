"use client";

import { useState } from "react";
import type { Publication } from "@/types/publication";

type PendingAction = "changes" | "reject" | null;

interface ApprovalActionsProps {
  publication: Publication;
  onApprove: () => void;
  onRequestChanges: (note: string) => void;
  onReject: (reason: string) => void;
}

export function ApprovalActions({ publication, onApprove, onRequestChanges, onReject }: ApprovalActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [note, setNote] = useState("");

  if (publication.status !== "in_review" && publication.status !== "pending_client") {
    return null;
  }

  function submit() {
    if (note.trim().length === 0) return;
    if (pendingAction === "changes") onRequestChanges(note.trim());
    if (pendingAction === "reject") onReject(note.trim());
    setNote("");
    setPendingAction(null);
  }

  function cancel() {
    setPendingAction(null);
    setNote("");
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Actions d&apos;approbation</h2>

      {pendingAction ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {pendingAction === "changes"
              ? "Modifications demandées (justification requise)"
              : "Motif du refus (obligatoire)"}
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={cancel}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={note.trim().length === 0}
              onClick={submit}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
            >
              Confirmer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Approuver
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("changes")}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Demander des modifications
          </button>
          <button
            type="button"
            onClick={() => setPendingAction("reject")}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-white/[.08] dark:hover:bg-red-500/10"
          >
            Refuser
          </button>
        </div>
      )}
    </section>
  );
}
