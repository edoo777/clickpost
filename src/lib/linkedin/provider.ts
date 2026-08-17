import { createPost, initializeImageUpload, uploadImageBytes } from "@/lib/linkedin/client";
import { isLinkedInOAuthConfigured, isLinkedInOrganizationAccessEnabled } from "@/lib/linkedin/config";
import { getValidAccessToken } from "@/lib/linkedin/connections";
import { downloadPublicationMedia } from "@/lib/linkedin/media";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type {
  AutomaticPublishResult,
  PerformanceFetchResult,
  PlatformCapabilities,
  PublishContext,
  PublishProvider,
} from "@/types/publishing-provider";

/**
 * Fournisseur LinkedIn réel — Posts API actuelle (`/rest/posts`), jamais `ugcPosts`. Couvre
 * progressivement : texte seul, texte + URL, une image, plusieurs images (officiellement pris en
 * charge par l'API Posts via `content.multiImage`). La vidéo n'est PAS encore prise en charge —
 * `publish()` échoue explicitement dans ce cas plutôt que de tenter un flux non testé ; le mode
 * manuel reste disponible pour toute publication vidéo en attendant. Implémentation de référence
 * pour toute nouvelle plateforme (voir docs/social-platform-setup.md).
 */
export const linkedInProvider: PublishProvider = {
  platform: "linkedin",

  isConfigured(): boolean {
    return isLinkedInOAuthConfigured();
  },

  capabilities(): PlatformCapabilities {
    return {
      automaticPublish: true,
      organizationAccounts: isLinkedInOrganizationAccessEnabled(),
      // Aucune portée de lecture de statistiques n'est demandée par l'intégration actuelle
      // (portées minimales — voir docs/linkedin-production-readiness.md) : jamais annoncé comme
      // possible tant que ce n'est pas réellement le cas.
      performanceFetch: false,
    };
  },

  async fetchPerformance(): Promise<PerformanceFetchResult> {
    return {
      status: "not_supported",
      reason: "L'intégration LinkedIn actuelle ne demande pas les portées de lecture de statistiques (Member Data Portability / Community Management API) — voir docs/linkedin-production-readiness.md.",
    };
  },

  async publish(context: PublishContext): Promise<AutomaticPublishResult> {
    if (!isLinkedInOAuthConfigured()) {
      return { status: "failed", errorMessage: "Intégration LinkedIn non configurée.", isPermanent: true };
    }

    const { publication, account } = context;

    if (!account.externalAccountId) {
      return { status: "failed", errorMessage: "Compte LinkedIn non connecté (aucune identité autorisée).", isPermanent: true };
    }
    if (account.status === "expired") {
      return { status: "failed", errorMessage: "Connexion LinkedIn expirée — reconnexion nécessaire.", isPermanent: true };
    }
    if (account.status === "insufficient_permission") {
      return { status: "failed", errorMessage: "Permission LinkedIn insuffisante pour publier.", isPermanent: true, isPermissionError: true };
    }
    if (account.status !== "connected") {
      return { status: "failed", errorMessage: "Compte LinkedIn non connecté.", isPermanent: true };
    }

    const violations = validatePlatformConstraints(publication);
    if (violations.length > 0) {
      return { status: "failed", errorMessage: violations.map((violation) => violation.message).join(" "), isPermanent: true };
    }

    if (publication.media.some((media) => media.type === "video")) {
      return {
        status: "failed",
        errorMessage: "La publication vidéo automatique LinkedIn n'est pas encore prise en charge — utilisez la publication manuelle.",
        isPermanent: true,
      };
    }

    const tokenResult = await getValidAccessToken(context.workspaceId, account.id, account.tokenExpiresAt ?? null);
    if (!tokenResult.ok) {
      const permanent = tokenResult.reason !== "refresh_failed"; // un échec réseau du rafraîchissement peut valoir un nouvel essai.
      return {
        status: "failed",
        errorMessage:
          tokenResult.reason === "expired_no_refresh"
            ? "Jeton LinkedIn expiré et non renouvelable automatiquement — reconnexion nécessaire."
            : "Impossible d'obtenir un jeton LinkedIn valide.",
        isPermanent: permanent,
      };
    }
    const accessToken = tokenResult.accessToken;

    const mediaUrns: string[] = [];
    for (const media of publication.media) {
      if (!media.storagePath) continue;
      const downloaded = await downloadPublicationMedia(media.storagePath, media.mimeType ?? "image/jpeg");
      if (!downloaded) {
        return { status: "failed", errorMessage: `Média « ${media.label || media.id} » introuvable dans le stockage.`, isPermanent: false };
      }
      const initialized = await initializeImageUpload(accessToken, account.externalAccountId);
      if (!initialized.ok) {
        return {
          status: "failed",
          errorMessage: initialized.error.message,
          // 429 exclu au même titre que pour createPost ci-dessous : une limitation de débit est
          // transitoire, jamais une raison d'abandonner définitivement la tentative (corrige une
          // incohérence trouvée lors d'un audit autonome, 2026-08-17).
          isPermanent: initialized.error.status >= 400 && initialized.error.status < 500 && initialized.error.status !== 429,
          isPermissionError: initialized.error.isPermissionError,
        };
      }
      const uploaded = await uploadImageBytes(initialized.data.uploadUrl, downloaded.bytes, downloaded.contentType);
      if (!uploaded.ok) {
        return { status: "failed", errorMessage: uploaded.error.message, isPermanent: false };
      }
      mediaUrns.push(initialized.data.imageUrn);
    }

    const result = await createPost(accessToken, {
      authorUrn: account.externalAccountId,
      text: publication.text || publication.excerpt,
      mediaUrns: mediaUrns.length > 0 ? mediaUrns : undefined,
    });

    if (!result.ok) {
      return {
        status: "failed",
        errorMessage: result.error.message,
        isPermanent: result.error.status >= 400 && result.error.status < 500 && result.error.status !== 429,
        isPermissionError: result.error.isPermissionError,
      };
    }

    return { status: "success", externalPostId: result.data.postUrn };
  },
};
