import { createTweet, uploadMedia } from "@/lib/x/client";
import { isXOAuthConfigured } from "@/lib/x/config";
import { getValidAccessToken } from "@/lib/x/connections";
import { downloadPublicationMedia } from "@/lib/social/media";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { AutomaticPublishResult, PerformanceFetchResult, PlatformCapabilities, PublishContext, PublishProvider } from "@/types/publishing-provider";

/**
 * Fournisseur X réel — API v2 (`/2/tweets`) pour le texte, API v1.1 (`/1.1/media/upload.json`)
 * pour les médias (voir client.ts). Texte, jusqu'à 4 images, ou une seule vidéo (jamais un
 * mélange image+vidéo — X ne le permet pas, contrainte appliquée ici même en complément des
 * limites génériques et indicatives de platform-constraints.ts).
 */
const MAX_IMAGES = 4;

export const xProvider: PublishProvider = {
  platform: "x",

  isConfigured(): boolean {
    return isXOAuthConfigured();
  },

  capabilities(): PlatformCapabilities {
    return { automaticPublish: true, organizationAccounts: false, performanceFetch: false };
  },

  async fetchPerformance(): Promise<PerformanceFetchResult> {
    return { status: "not_supported", reason: "Aucune portée de lecture de statistiques (accès payant distinct) n'est demandée par l'intégration actuelle." };
  },

  async publish(context: PublishContext): Promise<AutomaticPublishResult> {
    if (!isXOAuthConfigured()) {
      return { status: "failed", errorMessage: "Intégration X non configurée.", isPermanent: true };
    }

    const { publication, account } = context;

    if (!account.externalAccountId) {
      return { status: "failed", errorMessage: "Compte X non connecté.", isPermanent: true };
    }
    if (account.status === "expired") {
      return { status: "failed", errorMessage: "Connexion X expirée — reconnexion nécessaire.", isPermanent: true };
    }
    if (account.status === "insufficient_permission") {
      return { status: "failed", errorMessage: "Permission X insuffisante pour publier.", isPermanent: true, isPermissionError: true };
    }
    if (account.status !== "connected") {
      return { status: "failed", errorMessage: "Compte X non connecté.", isPermanent: true };
    }

    const violations = validatePlatformConstraints(publication);
    if (violations.length > 0) {
      return { status: "failed", errorMessage: violations.map((violation) => violation.message).join(" "), isPermanent: true };
    }

    const hasVideo = publication.media.some((media) => media.type === "video");
    if (hasVideo && publication.media.length > 1) {
      return { status: "failed", errorMessage: "X n'accepte pas de vidéo combinée à d'autres médias sur une même publication.", isPermanent: true };
    }
    if (!hasVideo && publication.media.length > MAX_IMAGES) {
      return { status: "failed", errorMessage: `X accepte au maximum ${MAX_IMAGES} images par publication.`, isPermanent: true };
    }

    const tokenResult = await getValidAccessToken(context.workspaceId, account.id, account.tokenExpiresAt ?? null);
    if (!tokenResult.ok) {
      const permanent = tokenResult.reason !== "refresh_failed";
      return {
        status: "failed",
        errorMessage:
          tokenResult.reason === "expired_no_refresh"
            ? "Jeton X expiré et non renouvelable automatiquement — reconnexion nécessaire."
            : "Impossible d'obtenir un jeton X valide.",
        isPermanent: permanent,
      };
    }
    const accessToken = tokenResult.accessToken;

    const mediaIds: string[] = [];
    for (const media of publication.media) {
      if (!media.storagePath) continue;
      const downloaded = await downloadPublicationMedia(media.storagePath, media.mimeType ?? (media.type === "video" ? "video/mp4" : "image/jpeg"));
      if (!downloaded) {
        return { status: "failed", errorMessage: `Média « ${media.label || media.id} » introuvable dans le stockage.`, isPermanent: false };
      }
      const uploaded = await uploadMedia({
        accessToken,
        bytes: downloaded.bytes,
        mimeType: downloaded.contentType,
        mediaCategory: media.type === "video" ? "tweet_video" : "tweet_image",
      });
      if (!uploaded.ok) {
        return {
          status: "failed",
          errorMessage: uploaded.error.message,
          isPermanent: uploaded.error.status >= 400 && uploaded.error.status < 500 && uploaded.error.status !== 429,
          isPermissionError: uploaded.error.isPermissionError,
        };
      }
      mediaIds.push(uploaded.data.mediaId);
    }

    const result = await createTweet(accessToken, { text: publication.text || publication.excerpt, mediaIds: mediaIds.length > 0 ? mediaIds : undefined });
    if (!result.ok) {
      return {
        status: "failed",
        errorMessage: result.error.message,
        isPermanent: result.error.status >= 400 && result.error.status < 500 && result.error.status !== 429,
        isPermissionError: result.error.isPermissionError,
      };
    }

    return { status: "success", externalPostId: result.data.tweetId };
  },
};
