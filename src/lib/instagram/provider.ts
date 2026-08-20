import { createInstagramMediaContainer, publishInstagramMedia } from "@/lib/meta/client";
import { isMetaOAuthConfigured } from "@/lib/meta/config";
import { getValidAccessToken } from "@/lib/instagram/connections";
import { getSignedPublicationMediaUrl } from "@/lib/social/media";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { AutomaticPublishResult, PerformanceFetchResult, PlatformCapabilities, PublishContext, PublishProvider } from "@/types/publishing-provider";

/**
 * Fournisseur Instagram réel — Instagram Graph API (Content Publishing), toujours via un compte
 * professionnel/créateur lié à une Page Facebook (jamais un compte personnel — l'API ne le
 * permet pas). Publication en deux étapes obligatoires : création du conteneur média
 * (`/media`), puis publication (`/media_publish`) une fois le fichier traité côté Instagram —
 * voir MEDIA_PUBLISH_MAX_ATTEMPTS ci-dessous pour la gestion de ce délai de traitement,
 * particulièrement long pour une vidéo (Reels).
 *
 * Un média est TOUJOURS requis (voir platform-constraints.ts, `requiresMedia: true`) : Instagram
 * n'accepte aucune publication texte seul via cette API.
 */
const MEDIA_PUBLISH_MAX_ATTEMPTS = 5;
const MEDIA_PUBLISH_RETRY_DELAY_MS = 3000;
const NOT_READY_ERROR_CODE_HINT = "media id is not available";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const instagramProvider: PublishProvider = {
  platform: "instagram",

  isConfigured(): boolean {
    return isMetaOAuthConfigured("instagram");
  },

  capabilities(): PlatformCapabilities {
    return { automaticPublish: true, organizationAccounts: true, performanceFetch: false };
  },

  async fetchPerformance(): Promise<PerformanceFetchResult> {
    return {
      status: "not_supported",
      reason: "Aucune portée de lecture de statistiques (ex. instagram_manage_insights) n'est demandée par l'intégration actuelle.",
    };
  },

  async publish(context: PublishContext): Promise<AutomaticPublishResult> {
    if (!isMetaOAuthConfigured("instagram")) {
      return { status: "failed", errorMessage: "Intégration Instagram non configurée.", isPermanent: true };
    }

    const { publication, account } = context;

    if (!account.externalAccountId) {
      return { status: "failed", errorMessage: "Compte professionnel Instagram non connecté.", isPermanent: true };
    }
    if (account.status === "expired") {
      return { status: "failed", errorMessage: "Connexion Instagram expirée — reconnexion nécessaire.", isPermanent: true };
    }
    if (account.status === "insufficient_permission") {
      return { status: "failed", errorMessage: "Permission Instagram insuffisante pour publier.", isPermanent: true, isPermissionError: true };
    }
    if (account.status !== "connected") {
      return { status: "failed", errorMessage: "Compte Instagram non connecté.", isPermanent: true };
    }

    const violations = validatePlatformConstraints(publication);
    if (violations.length > 0) {
      return { status: "failed", errorMessage: violations.map((violation) => violation.message).join(" "), isPermanent: true };
    }

    const facebookPageId = typeof account.platformMetadata?.facebookPageId === "string" ? account.platformMetadata.facebookPageId : null;
    if (!facebookPageId) {
      return { status: "failed", errorMessage: "Page Facebook liée introuvable pour ce compte Instagram — reconnexion nécessaire.", isPermanent: true };
    }

    const tokenResult = await getValidAccessToken(context.workspaceId, account.id, account.tokenExpiresAt ?? null, facebookPageId);
    if (!tokenResult.ok) {
      const permanent = tokenResult.reason !== "refresh_failed";
      return {
        status: "failed",
        errorMessage:
          tokenResult.reason === "expired_no_refresh"
            ? "Jeton Instagram expiré et non renouvelable automatiquement — reconnexion nécessaire."
            : "Impossible d'obtenir un jeton Instagram valide.",
        isPermanent: permanent,
      };
    }

    const firstMedia = publication.media[0];
    if (!firstMedia?.storagePath) {
      return { status: "failed", errorMessage: "Aucun média disponible pour cette publication Instagram.", isPermanent: true };
    }
    const signedUrl = await getSignedPublicationMediaUrl(firstMedia.storagePath);
    if (!signedUrl) {
      return { status: "failed", errorMessage: `Média « ${firstMedia.label || firstMedia.id} » introuvable dans le stockage.`, isPermanent: false };
    }

    const container = await createInstagramMediaContainer({
      igUserId: account.externalAccountId,
      pageAccessToken: tokenResult.accessToken,
      caption: publication.text || publication.excerpt,
      mediaUrl: signedUrl,
      mediaType: firstMedia.type === "video" ? "video" : "image",
    });
    if (!container.ok) {
      return {
        status: "failed",
        errorMessage: container.error.message,
        isPermanent: container.error.status >= 400 && container.error.status < 500 && container.error.status !== 429,
        isPermissionError: container.error.isPermissionError,
      };
    }

    for (let attempt = 1; attempt <= MEDIA_PUBLISH_MAX_ATTEMPTS; attempt++) {
      const published = await publishInstagramMedia(account.externalAccountId, tokenResult.accessToken, container.data.creationId);
      if (published.ok) {
        return { status: "success", externalPostId: published.data.mediaId };
      }
      const stillProcessing = published.error.message.toLowerCase().includes(NOT_READY_ERROR_CODE_HINT);
      if (!stillProcessing || attempt === MEDIA_PUBLISH_MAX_ATTEMPTS) {
        return {
          status: "failed",
          errorMessage: stillProcessing
            ? "Instagram n'a pas terminé le traitement du média dans le délai imparti — nouvelle tentative possible plus tard."
            : published.error.message,
          isPermanent: !stillProcessing && published.error.status >= 400 && published.error.status < 500 && published.error.status !== 429,
          isPermissionError: published.error.isPermissionError,
        };
      }
      await delay(MEDIA_PUBLISH_RETRY_DELAY_MS);
    }

    return { status: "failed", errorMessage: "Publication Instagram non confirmée après plusieurs tentatives.", isPermanent: false };
  },
};
