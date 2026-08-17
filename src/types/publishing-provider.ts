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
 * Ce que la plateforme permet réellement — déclaré statiquement par chaque fournisseur, jamais
 * déduit en devinant. Une capacité à `false` doit être respectée partout dans l'interface (ne
 * jamais proposer une action que la plateforme ne permet pas), qu'un identifiant API soit
 * configuré ou non : `isConfigured()` distingue "possible en théorie" de "branché aujourd'hui".
 */
export interface PlatformCapabilities {
  /** Publication automatique via API (par opposition à la confirmation manuelle après action
   * humaine sur la plateforme). */
  automaticPublish: boolean;
  /** La plateforme permet-elle de gérer plusieurs comptes/pages/organisations distincts du profil
   * personnel (ex. Pages LinkedIn, Comptes professionnels Instagram) ? */
  organizationAccounts: boolean;
  /** Récupération de métriques de performance réelles par API pour un contenu déjà publié. */
  performanceFetch: boolean;
}

export interface PlatformPerformanceMetrics {
  impressions?: number;
  reach?: number;
  views?: number;
  interactions?: number;
  newFollowers?: number;
  clicks?: number;
}

export type PerformanceFetchResult =
  /** La plateforme ou le niveau d'accès actuel ne permet pas cette lecture — jamais une donnée
   * inventée ou une estimation en son absence. */
  | { status: "not_supported"; reason: string }
  | { status: "error"; message: string }
  | { status: "ok"; metrics: PlatformPerformanceMetrics; fetchedAt: string };

/**
 * Abstraction commune à toutes les plateformes sociales — Social Provider / Adapter : chaque
 * plateforme implémente cette même interface, aucune logique métier (approbation, calendrier,
 * rapports) ne doit connaître les particularités d'une plateforme donnée. Un seul principe non
 * négociable : `publish()` ne doit JAMAIS retourner `"success"` si aucun appel réseau réel vers la
 * plateforme n'a réussi — `isConfigured()` renvoyant `false` doit bloquer tout appel à `publish()`
 * en amont. Voir docs/social-platform-setup.md pour la procédure de branchement d'une plateforme
 * réelle et src/lib/linkedin/provider.ts pour l'implémentation de référence (seule aujourd'hui
 * réellement branchée).
 */
export interface PublishProvider {
  platform: SocialPlatform;
  /** Vrai uniquement si de vraies clés/identifiants API sont configurés côté serveur pour cette
   * plateforme. */
  isConfigured(): boolean;
  /** Ce que cette plateforme permet dans l'absolu — indépendant de `isConfigured()`. */
  capabilities(): PlatformCapabilities;
  publish(context: PublishContext): Promise<AutomaticPublishResult>;
  /** Absent si la plateforme n'expose aucune API de mesure exploitable (voir `capabilities()`) —
   * sinon renvoie toujours un résultat honnête, jamais une métrique approchée ou devinée. */
  fetchPerformance?(context: { publication: Publication; account: SocialAccount }): Promise<PerformanceFetchResult>;
}
