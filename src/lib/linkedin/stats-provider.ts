import { isLinkedInOAuthConfigured } from "@/lib/linkedin/config";
import type { MetricValues } from "@/types/analytics";
import type { StatsProvider } from "@/types/stats-provider";

/**
 * Fournisseur de statistiques LinkedIn — honnête sur une limite réelle et actuelle : les portées
 * minimales du premier test (openid, profile, email, w_member_social — authentification et
 * publication uniquement) ne donnent accès à AUCUNE API de statistiques LinkedIn. La lecture
 * d'analytics réels nécessite des portées et une revue LinkedIn distinctes et supplémentaires
 * (Community Management API pour une Page Entreprise, ou Marketing Developer Platform), non
 * demandées ici par choix explicite (« ne réclame pas de permissions inutiles »).
 *
 * `fetchPublicationMetrics` renvoie donc toujours `null` aujourd'hui — jamais zéro présenté comme
 * une vraie mesure, jamais une donnée inventée. L'import CSV et la saisie manuelle existants
 * (Phase F) restent la seule source de statistiques LinkedIn tant qu'une portée d'analyse n'est
 * pas explicitement demandée et accordée dans une itération future.
 *
 * Préparation Phase 4 (Pages LinkedIn) : même une fois `r_organization_admin` et
 * `w_organization_social` accordés (publication en tant que Page), les statistiques d'une Page
 * restent inaccessibles sans une portée supplémentaire distincte (`r_organization_social`,
 * également soumise à revue LinkedIn) — ne jamais supposer que les statistiques deviennent
 * disponibles simplement parce que la publication sur Page l'est. Ce fournisseur devra vérifier
 * cette portée précise avant de tenter le moindre appel, le jour où elle est explicitement
 * demandée et accordée.
 */
export const linkedInStatsProvider: StatsProvider = {
  platform: "linkedin",

  isConfigured(): boolean {
    // Techniquement "configuré" (l'app existe), mais volontairement jamais capable de renvoyer
    // une vraie mesure sans la portée de lecture appropriée — voir fetchPublicationMetrics.
    return isLinkedInOAuthConfigured();
  },

  async fetchPublicationMetrics(): Promise<MetricValues | null> {
    return null;
  },
};

export const LINKEDIN_STATS_UNAVAILABLE_MESSAGE =
  "Permission LinkedIn requise — les statistiques réelles nécessitent une portée d'analyse non demandée lors de la connexion initiale. Utilisez l'import CSV ou la saisie manuelle.";
