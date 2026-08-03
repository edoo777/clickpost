"use client";

import { useState } from "react";
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_STYLE } from "@/lib/account-status";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import { computePublishReadiness, isAutomaticPublishingAvailable, PUBLISH_READINESS_LABEL } from "@/lib/publishing/providers";
import { getPublicationMediaSignedUrl } from "@/lib/supabase/publication-media-storage";
import type { SocialAccount } from "@/types/dashboard";
import type { Publication } from "@/types/publication";

interface ManualPublishPanelProps {
  publication: Publication;
  account: SocialAccount | undefined;
  onMarkPublished: () => void;
  onMarkFailed: (errorMessage: string) => void;
}

/**
 * Aucune plateforme sociale n'a d'intégration API réelle dans ce projet (voir
 * docs/social-platform-setup.md) — ce panneau ne propose donc jamais d'envoi automatique. Il
 * accompagne une publication manuelle réelle (copier le texte, télécharger les médias, publier
 * soi-même sur la plateforme), puis ne fait que consigner une confirmation humaine explicite.
 * Ne prétend jamais qu'une publication a été envoyée sans cette confirmation.
 */
export function ManualPublishPanel({ publication, account, onMarkPublished, onMarkFailed }: ManualPublishPanelProps) {
  const [copied, setCopied] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isReportingFailure, setIsReportingFailure] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  if (publication.status !== "scheduled" && publication.status !== "failed") return null;

  const violations = validatePlatformConstraints(publication);
  const automaticAvailable = isAutomaticPublishingAvailable(publication.platform);
  const readiness = computePublishReadiness(publication, account);

  async function handleCopyText() {
    const parts = [publication.text, publication.hashtags.filter((tag) => tag.trim().length > 0).join(" ")].filter(Boolean);
    await navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadMedia(mediaId: string, storagePath: string | undefined, label: string) {
    if (!storagePath) return;
    setDownloadingId(mediaId);
    const signed = await getPublicationMediaSignedUrl(storagePath);
    setDownloadingId(null);
    if (!signed) return;
    const link = document.createElement("a");
    link.href = signed;
    link.download = label || "media";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }

  const checklistItems = [
    { key: "text", label: "Texte copié" },
    ...(publication.media.length > 0 ? [{ key: "media", label: "Médias téléchargés" }] : []),
    { key: "posted", label: `Publication effectuée manuellement sur ${publication.platform}` },
  ];
  const allChecked = checklistItems.every((item) => checklist[item.key]);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">Publication manuelle</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ">
            {PUBLISH_READINESS_LABEL[readiness]}
          </span>
          {account && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ACCOUNT_STATUS_STYLE[account.status]}`}>
              {ACCOUNT_STATUS_LABEL[account.status]}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground ">
        {automaticAvailable
          ? "Un envoi automatique est configuré pour cette plateforme mais n'est pas encore branché ici."
          : `Aucune intégration API n'est configurée pour ${publication.platform} — publiez ce contenu vous-même sur la plateforme, puis confirmez ci-dessous. ClickPost n'affiche jamais un envoi automatique qui n'a pas réellement eu lieu.`}
      </p>

      {violations.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-500/10">
          {violations.map((violation) => (
            <p key={violation.field} className="text-xs font-medium text-red-700 dark:text-red-400">
              {violation.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopyText}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {copied ? "Texte copié ✓" : "Copier le texte"}
        </button>
        {publication.media.map((media) => (
          <button
            key={media.id}
            type="button"
            disabled={downloadingId === media.id || !media.storagePath}
            onClick={() => handleDownloadMedia(media.id, media.storagePath, media.label)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {downloadingId === media.id ? "Préparation…" : `Télécharger ${media.label || media.type}`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {checklistItems.map((item) => (
          <label key={item.key} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={Boolean(checklist[item.key])}
              onChange={(event) => setChecklist((prev) => ({ ...prev, [item.key]: event.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            {item.label}
          </label>
        ))}
      </div>

      {isReportingFailure ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Motif de l&apos;échec
            <textarea
              rows={2}
              value={failureReason}
              onChange={(event) => setFailureReason(event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsReportingFailure(false)}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={failureReason.trim().length === 0}
              onClick={() => {
                onMarkFailed(failureReason.trim());
                setIsReportingFailure(false);
                setFailureReason("");
              }}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmer l&apos;échec
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!allChecked}
            onClick={onMarkPublished}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Marquer comme publiée manuellement
          </button>
          <button
            type="button"
            onClick={() => setIsReportingFailure(true)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50  dark:hover:bg-red-500/10"
          >
            Signaler un échec
          </button>
        </div>
      )}
    </section>
  );
}
