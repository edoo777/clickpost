"use client";

import { useState } from "react";
import type { SocialAccount } from "@/types/dashboard";
import type { PublishAttempt } from "@/types/publishing-provider";
import type { Publication } from "@/types/publication";

interface LinkedInPublishActionProps {
  publication: Publication;
  account: SocialAccount | undefined;
  onPublished: (attempt: PublishAttempt, externalPostId: string) => void;
  onAttemptFailed: (attempt: PublishAttempt, isPermissionError: boolean) => void;
}

/**
 * Déclencheur de publication LinkedIn réelle par API — distinct de ManualPublishPanel (mode
 * manuel, jamais modifié par cette fonctionnalité). Ne s'affiche que pour une publication
 * ciblant LinkedIn avec un compte réellement connecté ; n'annonce jamais un succès sans
 * identifiant externe confirmé par /api/social/linkedin/publish.
 */
export function LinkedInPublishAction({ publication, account, onPublished, onAttemptFailed }: LinkedInPublishActionProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (publication.platform !== "linkedin") return null;
  if (!account || account.status !== "connected") return null;
  if (publication.status === "published") return null;
  if ((publication.publishAttempts ?? []).some((attempt) => attempt.status === "success")) return null;

  async function handlePublish() {
    if (isPublishing) return; // empêche les doubles clics et les doubles envois.
    setIsPublishing(true);
    setError(null);
    try {
      const response = await fetch("/api/social/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId: publication.id }),
      });
      const body = (await response.json().catch(() => null)) as
        | { status: "ok"; attempt: PublishAttempt; externalPostId: string }
        | { status: "error"; message: string; attempt?: PublishAttempt; isPermissionError?: boolean }
        | null;
      if (!body) {
        setError("Réponse invalide du serveur.");
        return;
      }
      if (body.status === "ok") {
        onPublished(body.attempt, body.externalPostId);
        return;
      }
      setError(body.message);
      if (body.attempt) onAttemptFailed(body.attempt, Boolean(body.isPermissionError));
    } catch {
      setError("Publication impossible (réseau).");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
          Compte LinkedIn connecté — publication réelle par API disponible
        </span>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={isPublishing}
          className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPublishing ? "Publication en cours…" : "Publier via LinkedIn"}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
