import { fetchCreatorInfo, fetchPublishStatus, initVideoPublish } from "@/lib/tiktok/client";
import { isTikTokOAuthConfigured } from "@/lib/tiktok/config";
import { getValidAccessToken } from "@/lib/tiktok/connections";
import { getSignedPublicationMediaUrl } from "@/lib/social/media";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { AutomaticPublishResult, PerformanceFetchResult, PlatformCapabilities, PublishContext, PublishProvider } from "@/types/publishing-provider";

/**
 * Fournisseur TikTok réel — Content Posting API, vidéo uniquement (voir
 * platform-constraints.ts). Publie via `PULL_FROM_URL` (TikTok récupère lui-même le fichier
 * depuis l'URL signée temporaire, voir src/lib/social/media.ts) puis interroge le statut réel
 * avant de confirmer un succès — jamais un succès annoncé sur la seule confirmation de
 * soumission (`publish_id`).
 *
 * Limite honnête et documentée (voir docs/social-platform-setup.md) : tant que l'application
 * ClickPost n'a pas été auditée par TikTok, toute publication est automatiquement redirigée vers
 * la boîte de réception privée du créateur (`SEND_TO_USER_INBOX`) plutôt que publiée publiquement
 * — ClickPost ne présente ce cas comme un succès que si TikTok confirme explicitement l'un des
 * statuts terminaux connus, jamais un statut "public" supposé.
 */
const STATUS_POLL_MAX_ATTEMPTS = 5;
const STATUS_POLL_DELAY_MS = 4000;
const TERMINAL_STATUSES = new Set(["PUBLISH_COMPLETE", "SEND_TO_USER_INBOX", "FAILED"]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const tiktokProvider: PublishProvider = {
  platform: "tiktok",

  isConfigured(): boolean {
    return isTikTokOAuthConfigured();
  },

  capabilities(): PlatformCapabilities {
    return { automaticPublish: true, organizationAccounts: false, performanceFetch: false };
  },

  async fetchPerformance(): Promise<PerformanceFetchResult> {
    return { status: "not_supported", reason: "Aucune portée de lecture de statistiques (ex. video.list) n'est demandée par l'intégration actuelle." };
  },

  async publish(context: PublishContext): Promise<AutomaticPublishResult> {
    if (!isTikTokOAuthConfigured()) {
      return { status: "failed", errorMessage: "Intégration TikTok non configurée.", isPermanent: true };
    }

    const { publication, account } = context;

    if (!account.externalAccountId) {
      return { status: "failed", errorMessage: "Compte TikTok non connecté.", isPermanent: true };
    }
    if (account.status === "expired") {
      return { status: "failed", errorMessage: "Connexion TikTok expirée — reconnexion nécessaire.", isPermanent: true };
    }
    if (account.status === "insufficient_permission") {
      return { status: "failed", errorMessage: "Permission TikTok insuffisante pour publier.", isPermanent: true, isPermissionError: true };
    }
    if (account.status !== "connected") {
      return { status: "failed", errorMessage: "Compte TikTok non connecté.", isPermanent: true };
    }

    const violations = validatePlatformConstraints(publication);
    if (violations.length > 0) {
      return { status: "failed", errorMessage: violations.map((violation) => violation.message).join(" "), isPermanent: true };
    }

    const tokenResult = await getValidAccessToken(context.workspaceId, account.id, account.tokenExpiresAt ?? null);
    if (!tokenResult.ok) {
      const permanent = tokenResult.reason !== "refresh_failed";
      return {
        status: "failed",
        errorMessage:
          tokenResult.reason === "expired_no_refresh"
            ? "Jeton TikTok expiré et non renouvelable automatiquement — reconnexion nécessaire."
            : "Impossible d'obtenir un jeton TikTok valide.",
        isPermanent: permanent,
      };
    }
    const accessToken = tokenResult.accessToken;

    const firstMedia = publication.media[0];
    if (!firstMedia?.storagePath) {
      return { status: "failed", errorMessage: "Aucune vidéo disponible pour cette publication TikTok.", isPermanent: true };
    }
    const signedUrl = await getSignedPublicationMediaUrl(firstMedia.storagePath);
    if (!signedUrl) {
      return { status: "failed", errorMessage: `Média « ${firstMedia.label || firstMedia.id} » introuvable dans le stockage.`, isPermanent: false };
    }

    const creatorInfo = await fetchCreatorInfo(accessToken);
    if (!creatorInfo.ok) {
      return {
        status: "failed",
        errorMessage: creatorInfo.error.message,
        isPermanent: creatorInfo.error.status >= 400 && creatorInfo.error.status < 500 && creatorInfo.error.status !== 429,
        isPermissionError: creatorInfo.error.isPermissionError,
      };
    }
    const privacyLevel = creatorInfo.data.privacyLevelOptions[0];
    if (!privacyLevel) {
      return { status: "failed", errorMessage: "TikTok n'a renvoyé aucune option de confidentialité disponible pour ce créateur.", isPermanent: true };
    }

    const init = await initVideoPublish(accessToken, { videoUrl: signedUrl, title: publication.text || publication.excerpt, privacyLevel });
    if (!init.ok) {
      return {
        status: "failed",
        errorMessage: init.error.message,
        isPermanent: init.error.status >= 400 && init.error.status < 500 && init.error.status !== 429,
        isPermissionError: init.error.isPermissionError,
      };
    }

    for (let attempt = 1; attempt <= STATUS_POLL_MAX_ATTEMPTS; attempt++) {
      await delay(STATUS_POLL_DELAY_MS);
      const status = await fetchPublishStatus(accessToken, init.data.publishId);
      if (!status.ok) {
        return { status: "failed", errorMessage: status.error.message, isPermanent: false, isPermissionError: status.error.isPermissionError };
      }
      if (status.data.status === "PUBLISH_COMPLETE") {
        return { status: "success", externalPostId: status.data.publiclyAvailablePostId ?? init.data.publishId };
      }
      if (status.data.status === "SEND_TO_USER_INBOX") {
        // Réellement envoyée côté TikTok, mais jamais publique tant que l'application n'est pas
        // auditée (voir docs/social-platform-setup.md) — jamais présenté comme un succès de
        // publication publique, un statut d'échec explicite et permanent guide vers le mode
        // manuel ou l'audit de l'application.
        return {
          status: "failed",
          errorMessage: "TikTok a accepté la vidéo mais l'a envoyée en brouillon privé (application non encore auditée par TikTok) — jamais publiée publiquement.",
          isPermanent: true,
        };
      }
      if (status.data.status === "FAILED") {
        return { status: "failed", errorMessage: status.data.failReason ?? "Échec de publication TikTok.", isPermanent: true };
      }
      if (TERMINAL_STATUSES.has(status.data.status)) break;
    }

    return { status: "failed", errorMessage: "Publication TikTok non confirmée après plusieurs tentatives.", isPermanent: false };
  },
};
