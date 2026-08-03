export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "x"
  | "threads"
  | "pinterest"
  | "other";

/**
 * `connected`/`syncing`/`expired`/`insufficient_permission` sont désormais réellement posés par
 * l'intégration LinkedIn (voir src/lib/linkedin/) une fois configurée — `profile_only` reste la
 * seule valeur possible pour toute plateforme sans intégration API réelle. Ne jamais afficher
 * `connected` sans une véritable confirmation OAuth/API.
 */
export type AccountStatus =
  | "connected"
  | "disconnected"
  | "expired"
  | "error"
  | "syncing"
  | "profile_only"
  | "insufficient_permission";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  /** Nom de marque en texte libre — conservé pour compatibilité, préférer `brandId` quand présent. */
  brand: string;
  /** Identifiant fiable de la marque — additif ; absent sur les comptes créés avant cette fonctionnalité. */
  brandId?: string;
  accountName: string;
  handle: string;
  /** URL du profil, facultative. */
  profileUrl?: string;
  /** Langue du compte, facultative. */
  language?: string;
  /** Audience ou marché visé, facultatif. */
  audienceOrMarket?: string;
  status: AccountStatus;
  lastSyncedAt: string | null;
  /** Libellés lisibles à afficher (ex. "Publication de contenu") — jamais des identifiants de
   * portée OAuth bruts, voir `oauthScopes` pour ceux-ci. */
  permissions: string[];
  /** Identifiant du compte chez la plateforme distante (ex. `urn:li:person:...` pour LinkedIn) —
   * jamais un secret, sûr à afficher, absent tant qu'aucune connexion OAuth réelle n'a abouti. */
  externalAccountId?: string;
  /** Portées OAuth brutes réellement accordées (ex. "w_member_social") — jamais devinées, copie
   * exacte de ce que la plateforme a confirmé lors de l'échange ou du rafraîchissement du jeton. */
  oauthScopes?: string[];
  /** Expiration du jeton d'accès — métadonnée non sensible (ne permet pas de reconstruire le
   * jeton), utile pour un affichage honnête sans jamais exposer le jeton lui-même. */
  tokenExpiresAt?: string;
  /** Dernière vérification réelle de l'état de connexion (appel à la plateforme, pas une simple
   * lecture locale). */
  lastCheckedAt?: string;
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  change: number;
}
