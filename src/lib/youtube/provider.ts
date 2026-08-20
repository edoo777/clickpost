import { uploadVideo } from "@/lib/youtube/client";
import { getYouTubeDefaultPrivacyStatus, isYouTubeOAuthConfigured } from "@/lib/youtube/config";
import { getValidAccessToken } from "@/lib/youtube/connections";
import { downloadPublicationMedia } from "@/lib/social/media";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { AutomaticPublishResult, PerformanceFetchResult, PlatformCapabilities, PublishContext, PublishProvider } from "@/types/publishing-provider";

/**
 * Fournisseur YouTube réel — YouTube Data API v3, téléversement résumable. Vidéo uniquement (voir
 * platform-constraints.ts). Visibilité par défaut `private` (voir
 * getYouTubeDefaultPrivacyStatus()) — jamais `public` sans un choix explicite de votre part.
 */
export const youtubeProvider: PublishProvider = {
  platform: "youtube",

  isConfigured(): boolean {
    return isYouTubeOAuthConfigured();
  },

  capabilities(): PlatformCapabilities {
    return { automaticPublish: true, organizationAccounts: false, performanceFetch: false };
  },

  async fetchPerformance(): Promise<PerformanceFetchResult> {
    return { status: "not_supported", reason: "Aucune portée de lecture de statistiques (ex. yt-analytics.readonly) n'est demandée par l'intégration actuelle." };
  },

  async publish(context: PublishContext): Promise<AutomaticPublishResult> {
    if (!isYouTubeOAuthConfigured()) {
      return { status: "failed", errorMessage: "Intégration YouTube non configurée.", isPermanent: true };
    }

    const { publication, account } = context;

    if (!account.externalAccountId) {
      return { status: "failed", errorMessage: "Chaîne YouTube non connectée.", isPermanent: true };
    }
    if (account.status === "expired") {
      return { status: "failed", errorMessage: "Connexion YouTube expirée — reconnexion nécessaire.", isPermanent: true };
    }
    if (account.status === "insufficient_permission") {
      return { status: "failed", errorMessage: "Permission YouTube insuffisante pour publier.", isPermanent: true, isPermissionError: true };
    }
    if (account.status !== "connected") {
      return { status: "failed", errorMessage: "Chaîne YouTube non connectée.", isPermanent: true };
    }

    const violations = validatePlatformConstraints(publication);
    if (violations.length > 0) {
      return { status: "failed", errorMessage: violations.map((violation) => violation.message).join(" "), isPermanent: true };
    }

    const video = publication.media.find((media) => media.type === "video");
    if (!video?.storagePath) {
      return { status: "failed", errorMessage: "Aucune vidéo disponible pour cette publication YouTube.", isPermanent: true };
    }

    const tokenResult = await getValidAccessToken(context.workspaceId, account.id, account.tokenExpiresAt ?? null);
    if (!tokenResult.ok) {
      const permanent = tokenResult.reason !== "refresh_failed";
      return {
        status: "failed",
        errorMessage:
          tokenResult.reason === "expired_no_refresh"
            ? "Jeton YouTube expiré et non renouvelable automatiquement — reconnexion nécessaire."
            : "Impossible d'obtenir un jeton YouTube valide.",
        isPermanent: permanent,
      };
    }

    const downloaded = await downloadPublicationMedia(video.storagePath, video.mimeType ?? "video/mp4");
    if (!downloaded) {
      return { status: "failed", errorMessage: `Média « ${video.label || video.id} » introuvable dans le stockage.`, isPermanent: false };
    }

    const result = await uploadVideo({
      accessToken: tokenResult.accessToken,
      title: (publication.excerpt || "Sans titre").slice(0, 100),
      description: publication.text,
      privacyStatus: getYouTubeDefaultPrivacyStatus(),
      bytes: downloaded.bytes,
      mimeType: downloaded.contentType,
    });

    if (!result.ok) {
      return {
        status: "failed",
        errorMessage: result.error.message,
        isPermanent: result.error.status >= 400 && result.error.status < 500 && result.error.status !== 429,
        isPermissionError: result.error.isPermissionError,
      };
    }

    return { status: "success", externalPostId: result.data.videoId };
  },
};
