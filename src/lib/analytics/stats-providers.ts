import type { SocialPlatform } from "@/types/dashboard";
import type { StatsProvider } from "@/types/stats-provider";

/**
 * Registre des fournisseurs de statistiques par plateforme — même patron que
 * src/lib/publishing/providers.ts. Aucune plateforme n'a d'intégration API réelle dans ce projet
 * (voir docs/social-platform-setup.md) : `isConfigured()` renvoie donc toujours `false`, et
 * l'interface doit toujours orienter vers l'import manuel plutôt que de laisser croire à des
 * statistiques automatiquement récupérées.
 */
function buildUnconfiguredProvider(platform: SocialPlatform): StatsProvider {
  return {
    platform,
    isConfigured: () => false,
    fetchPublicationMetrics: async () => null,
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

const registry = new Map<SocialPlatform, StatsProvider>(PLATFORMS.map((platform) => [platform, buildUnconfiguredProvider(platform)]));

export function getStatsProvider(platform: SocialPlatform): StatsProvider {
  return registry.get(platform) ?? buildUnconfiguredProvider(platform);
}

export function isAutomaticStatsAvailable(platform: SocialPlatform): boolean {
  return getStatsProvider(platform).isConfigured();
}
