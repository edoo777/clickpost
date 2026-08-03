import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { Publication } from "@/types/publication";

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
  /** Vrai pour un refus de permission confirmé — permet à l'appelant de distinguer un état
   * "Permission insuffisante" d'un échec générique, sans deviner à partir du seul message. */
  isPermissionError?: boolean;
  /** Vrai si l'échec ne peut pas réussir en rejouant la même publication telle quelle (ex.
   * contrainte de plateforme violée, jamais un problème réseau) — utilisé pour éviter une
   * nouvelle tentative automatique inutile. */
  isPermanent?: boolean;
}

export interface PublishContext {
  publication: Publication;
  account: SocialAccount;
  workspaceId: string;
  /** Clé d'idempotence locale à la tentative — un fournisseur réel doit l'utiliser pour éviter
   * une double publication si la même tentative est rejouée (ex. après une coupure réseau juste
   * après un succès distant non confirmé localement). */
  idempotencyKey: string;
}

/**
 * Abstraction commune à toutes les plateformes sociales. Un seul principe non négociable :
 * `publish()` ne doit JAMAIS retourner `"success"` si aucun appel réseau réel vers la plateforme
 * n'a réussi — `isConfigured()` renvoyant `false` doit bloquer tout appel à `publish()` en amont.
 */
export interface PublishProvider {
  platform: SocialPlatform;
  /** Vrai uniquement si de vraies clés/identifiants API sont configurés côté serveur pour cette
   * plateforme. */
  isConfigured(): boolean;
  publish(context: PublishContext): Promise<AutomaticPublishResult>;
}
