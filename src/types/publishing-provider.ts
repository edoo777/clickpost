import type { SocialPlatform } from "@/types/dashboard";

/**
 * État réel de préparation d'une publication pour un envoi automatique — dérivé de faits
 * vérifiables (compte connecté ? fournisseur configuré ? contraintes respectées ?), jamais
 * inventé ni optimiste par défaut.
 */
export type PublishReadiness =
  | "not_connected"
  | "connection_required"
  | "provider_not_configured"
  | "constraints_violated"
  | "ready"
  | "publishing"
  | "published"
  | "failed";

export interface PublishAttempt {
  id: string;
  /** "manual" = confirmée par un humain après publication réelle sur la plateforme ;
   * "automatic" = envoyée par un fournisseur d'API réel (aucun fournisseur réel n'existe encore
   * dans ce projet — ce mode reste préparé pour une intégration future documentée). */
  mode: "manual" | "automatic";
  status: "success" | "failed";
  actorName: string;
  createdAt: string;
  errorMessage?: string;
  /** Identifiant du post sur la plateforme distante — jamais inventé ; absent en mode manuel. */
  externalPostId?: string;
}

export interface AutomaticPublishResult {
  status: "success" | "failed";
  externalPostId?: string;
  errorMessage?: string;
}

/**
 * Abstraction commune à toutes les plateformes sociales. Un seul principe non négociable :
 * `publish()` ne doit JAMAIS retourner `"success"` si aucun appel réseau réel vers la plateforme
 * n'a réussi — `isConfigured()` renvoyant `false` doit bloquer tout appel à `publish()` en amont.
 */
export interface PublishProvider {
  platform: SocialPlatform;
  /** Vrai uniquement si de vraies clés/identifiants API sont configurés côté serveur pour cette
   * plateforme. Aujourd'hui : toujours `false`, aucune plateforme sociale n'a d'intégration API
   * réelle dans ce projet (voir docs/social-platform-setup.md). */
  isConfigured(): boolean;
  publish(): Promise<AutomaticPublishResult>;
}
