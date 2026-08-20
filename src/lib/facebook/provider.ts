import { createFacebookPost } from "@/lib/meta/client";
import { isMetaOAuthConfigured } from "@/lib/meta/config";
import { getValidAccessToken } from "@/lib/facebook/connections";
import { getSignedPublicationMediaUrl } from "@/lib/social/media";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { AutomaticPublishResult, PerformanceFetchResult, PlatformCapabilities, PublishContext, PublishProvider } from "@/types/publishing-provider";

/**
 * Fournisseur Facebook réel — Pages API (`/{page-id}/feed`, `/photos`, `/videos`). Publie
 * toujours au nom d'une Page Facebook (jamais d'un profil personnel — l'API Graph ne permet plus
 * de publier sur le mur d'un profil personnel depuis une application tierce depuis 2018). Couvre
 * texte, une image, une vidéo (un seul média par publication — Facebook accepte plusieurs photos
 * en album via un flux distinct non implémenté ici, voir platform-constraints.ts qui déclare
 * pourtant `mediaMax: 10` : cette limite reste indicative de ce que Facebook permet dans
 * l'absolu, `publish()` ci-dessous se limite volontairement au premier média jusqu'à ce qu'un
 * besoin réel justifie l'implémentation d'un album multi-photos).
 */
export const facebookProvider: PublishProvider = {
  platform: "facebook",

  isConfigured(): boolean {
    return isMetaOAuthConfigured("facebook");
  },

  capabilities(): PlatformCapabilities {
    return { automaticPublish: true, organizationAccounts: true, performanceFetch: false };
  },

  async fetchPerformance(): Promise<PerformanceFetchResult> {
    return {
      status: "not_supported",
      reason: "Aucune portée de lecture de statistiques (ex. read_insights) n'est demandée par l'intégration actuelle.",
    };
  },

  async publish(context: PublishContext): Promise<AutomaticPublishResult> {
    if (!isMetaOAuthConfigured("facebook")) {
      return { status: "failed", errorMessage: "Intégration Facebook non configurée.", isPermanent: true };
    }

    const { publication, account } = context;

    if (!account.externalAccountId) {
      return { status: "failed", errorMessage: "Page Facebook non connectée (aucune Page sélectionnée).", isPermanent: true };
    }
    if (account.status === "expired") {
      return { status: "failed", errorMessage: "Connexion Facebook expirée — reconnexion nécessaire.", isPermanent: true };
    }
    if (account.status === "insufficient_permission") {
      return { status: "failed", errorMessage: "Permission Facebook insuffisante pour publier.", isPermanent: true, isPermissionError: true };
    }
    if (account.status !== "connected") {
      return { status: "failed", errorMessage: "Page Facebook non connectée.", isPermanent: true };
    }

    const violations = validatePlatformConstraints(publication);
    if (violations.length > 0) {
      return { status: "failed", errorMessage: violations.map((violation) => violation.message).join(" "), isPermanent: true };
    }

    const tokenResult = await getValidAccessToken(context.workspaceId, account.id, account.tokenExpiresAt ?? null, account.externalAccountId);
    if (!tokenResult.ok) {
      const permanent = tokenResult.reason !== "refresh_failed";
      return {
        status: "failed",
        errorMessage:
          tokenResult.reason === "expired_no_refresh"
            ? "Jeton Facebook expiré et non renouvelable automatiquement — reconnexion nécessaire."
            : "Impossible d'obtenir un jeton Facebook valide.",
        isPermanent: permanent,
      };
    }

    const firstMedia = publication.media[0];
    let mediaUrl: string | undefined;
    let mediaType: "image" | "video" | undefined;
    if (firstMedia?.storagePath) {
      const signedUrl = await getSignedPublicationMediaUrl(firstMedia.storagePath);
      if (!signedUrl) {
        return { status: "failed", errorMessage: `Média « ${firstMedia.label || firstMedia.id} » introuvable dans le stockage.`, isPermanent: false };
      }
      mediaUrl = signedUrl;
      mediaType = firstMedia.type === "video" ? "video" : "image";
    }

    const result = await createFacebookPost({
      pageId: account.externalAccountId,
      pageAccessToken: tokenResult.accessToken,
      message: publication.text || publication.excerpt,
      mediaUrl,
      mediaType,
    });

    if (!result.ok) {
      return {
        status: "failed",
        errorMessage: result.error.message,
        isPermanent: result.error.status >= 400 && result.error.status < 500 && result.error.status !== 429,
        isPermissionError: result.error.isPermissionError,
      };
    }

    return { status: "success", externalPostId: result.data.postId };
  },
};
