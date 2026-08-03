import type { SocialPlatform } from "@/types/dashboard";
import type { MetricValues } from "@/types/analytics";

/**
 * Abstraction commune à toutes les plateformes pour la récupération de statistiques réelles —
 * même principe que PublishProvider (src/types/publishing-provider.ts) : `isConfigured()` doit
 * être vérifié avant tout appel, et aucune méthode ne doit jamais renvoyer de valeurs inventées.
 * Aucun fournisseur n'est configuré aujourd'hui (voir src/lib/analytics/stats-providers.ts).
 */
export interface StatsProvider {
  platform: SocialPlatform;
  isConfigured(): boolean;
  /** `null` si la plateforme n'a pas (ou plus) cette publication, jamais une valeur par défaut
   * inventée pour combler l'absence de données. */
  fetchPublicationMetrics(externalPostId: string): Promise<MetricValues | null>;
}
