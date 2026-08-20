import { facebookProvider } from "@/lib/facebook/provider";
import { instagramProvider } from "@/lib/instagram/provider";
import { linkedInProvider } from "@/lib/linkedin/provider";
import { tiktokProvider } from "@/lib/tiktok/provider";
import { xProvider } from "@/lib/x/provider";
import { youtubeProvider } from "@/lib/youtube/provider";
import { validatePlatformConstraints } from "@/lib/publishing/platform-constraints";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { Publication } from "@/types/publication";
import type { PlatformCapabilities, PublishProvider, PublishReadiness } from "@/types/publishing-provider";

/**
 * Registre des fournisseurs de publication par plateforme — Social Provider / Adapter (voir
 * docs/social-platform-setup.md). LinkedIn, Instagram, Facebook, TikTok, X et YouTube ont
 * désormais chacun un fournisseur réellement branché (code complet, `isConfigured()` reflétant
 * les identifiants réellement présents côté serveur — voir le fournisseur de chaque plateforme
 * sous src/lib/<plateforme>/provider.ts) ; Threads, Pinterest et "other" renvoient toujours un
 * fournisseur « non configuré » — `isConfigured()` y renvoie toujours `false`, jamais un envoi
 * automatique simulé. Brancher une nouvelle plateforme : implémenter `PublishProvider` (voir
 * linkedInProvider comme référence historique) et remplacer son entrée ci-dessous — aucun autre
 * fichier de l'application n'a besoin de changer (composants, routes, planificateur consomment
 * tous cette même interface).
 */
function buildUnconfiguredProvider(platform: SocialPlatform, capabilities: PlatformCapabilities): PublishProvider {
  return {
    platform,
    isConfigured: () => false,
    capabilities: () => capabilities,
    publish: async () => ({
      status: "failed",
      errorMessage: `Aucun fournisseur de publication automatique n'est configuré pour ${platform}. Utilisez la publication manuelle.`,
      isPermanent: true,
    }),
    fetchPerformance: async () => ({
      status: "not_supported",
      reason: `Aucun fournisseur n'est configuré pour ${platform}.`,
    }),
  };
}

// Capacités théoriques de chaque plateforme (indépendantes de la configuration actuelle) —
// reflètent ce que l'API officielle de chaque réseau permet, pas ce qui est branché aujourd'hui.
// Source : documentation publique de chaque plateforme au moment de l'écriture (voir
// docs/social-platform-setup.md pour le détail par plateforme et les portées nécessaires).
const PLATFORM_CAPABILITIES: Record<SocialPlatform, PlatformCapabilities> = {
  linkedin: { automaticPublish: true, organizationAccounts: true, performanceFetch: true },
  instagram: { automaticPublish: true, organizationAccounts: true, performanceFetch: true },
  facebook: { automaticPublish: true, organizationAccounts: true, performanceFetch: true },
  tiktok: { automaticPublish: true, organizationAccounts: false, performanceFetch: true },
  youtube: { automaticPublish: true, organizationAccounts: false, performanceFetch: true },
  x: { automaticPublish: true, organizationAccounts: false, performanceFetch: true },
  threads: { automaticPublish: true, organizationAccounts: false, performanceFetch: false },
  pinterest: { automaticPublish: true, organizationAccounts: false, performanceFetch: true },
  other: { automaticPublish: false, organizationAccounts: false, performanceFetch: false },
};

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

const REAL_PROVIDERS: Partial<Record<SocialPlatform, PublishProvider>> = {
  linkedin: linkedInProvider,
  instagram: instagramProvider,
  facebook: facebookProvider,
  tiktok: tiktokProvider,
  x: xProvider,
  youtube: youtubeProvider,
};

const providerRegistry = new Map<SocialPlatform, PublishProvider>(
  PLATFORMS.map((platform) => [platform, REAL_PROVIDERS[platform] ?? buildUnconfiguredProvider(platform, PLATFORM_CAPABILITIES[platform])])
);

export function getPublishProvider(platform: SocialPlatform): PublishProvider {
  return providerRegistry.get(platform) ?? buildUnconfiguredProvider(platform, PLATFORM_CAPABILITIES.other);
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
