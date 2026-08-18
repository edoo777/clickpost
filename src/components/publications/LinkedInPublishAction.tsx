"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
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
  const t = useTranslations();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (publication.platform !== "linkedin") return null;
  if (!account || account.status !== "connected") return null;
  if (publication.status === "published") return null;
  if ((publication.publishAttempts ?? []).some((attempt) => attempt.status === "success")) return null;
  // Une publication réelle ne peut être déclenchée que sur un contenu déjà approuvé — jamais
  // depuis idée/brouillon/en revue/etc. "failed" reste autorisé (nouvelle tentative manuelle après
  // un échec, voir ManualPublishPanel pour le même principe). Vérifié aussi côté serveur
  // (/api/social/linkedin/publish) et, en dernier recours, par un verrou en base de données.
  if (!["approved", "scheduled", "failed"].includes(publication.status)) return null;

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
        setError(t("publications.linkedinPublish.invalidResponse"));
        return;
      }
      if (body.status === "ok") {
        onPublished(body.attempt, body.externalPostId);
        return;
      }
      setError(body.message);
      if (body.attempt) onAttemptFailed(body.attempt, Boolean(body.isPermissionError));
    } catch {
      setError(t("publications.linkedinPublish.networkError"));
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
          {t("publications.linkedinPublish.connectedNotice")}
        </span>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={isPublishing}
          className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPublishing ? t("publications.linkedinPublish.publishing") : t("publications.linkedinPublish.publishButton")}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
