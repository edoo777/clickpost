import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { Publication } from "@/types/publication";
import type { PublishProvider, PublishReadiness } from "@/types/publishing-provider";

/**
 * Registre des fournisseurs de publication par plateforme. Aucune plateforme n'a aujourd'hui
 * d'intégration API réelle (aucun identifiant OAuth/API social n'est configuré dans ce projet —
 * voir docs/social-platform-setup.md pour la procédure à suivre le jour où l'un d'eux est ajouté).
 * `isConfigured()` renvoie donc toujours `false` : l'interface doit toujours orienter vers le mode
 * de publication manuelle plutôt que de proposer un envoi automatique qui échouerait ou, pire,
 * simulerait un succès.
 */
function buildUnconfiguredProvider(platform: SocialPlatform): PublishProvider {
  return {
    platform,
    isConfigured: () => false,
    publish: async () => ({
      status: "failed",
      errorMessage: `Aucun fournisseur de publication automatique n'est configuré pour ${platform}. Utilisez la publication manuelle.`,
    }),
  };
}

const PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "x",
  "threads",
  "pinterest",
  "other",
];

const providerRegistry = new Map<SocialPlatform, PublishProvider>(
  PLATFORMS.map((platform) => [platform, buildUnconfiguredProvider(platform)])
);

export function getPublishProvider(platform: SocialPlatform): PublishProvider {
  return providerRegistry.get(platform) ?? buildUnconfiguredProvider(platform);
}

export function isAutomaticPublishingAvailable(platform: SocialPlatform): boolean {
  return getPublishProvider(platform).isConfigured();
}

/** État réel dérivé des faits disponibles (compte, contraintes, statut) — jamais optimiste par
 * défaut, jamais "prêt" tant qu'un fait objectif ne le confirme pas. */
export function computePublishReadiness(publication: Publication, account: SocialAccount | undefined): PublishReadiness {
  if (publication.status === "published") return "published";
  if (publication.status === "failed") return "failed";
  if (publication.status !== "scheduled") return "not_connected";
  if (!account || account.status === "disconnected") return "not_connected";
  if (account.status === "expired") return "connection_required";
  if (account.status === "error") return "connection_required";
  if (validatePlatformConstraints(publication).length > 0) return "constraints_violated";
  if (!isAutomaticPublishingAvailable(publication.platform)) return "provider_not_configured";
  return "ready";
}

export const PUBLISH_READINESS_LABEL: Record<PublishReadiness, string> = {
  not_connected: "Non connecté",
  connection_required: "Connexion requise",
  provider_not_configured: "Action manuelle requise",
  constraints_violated: "Contraintes non respectées",
  ready: "Prêt",
  publishing: "Publication en cours",
  published: "Publié",
  failed: "Échec",
};
