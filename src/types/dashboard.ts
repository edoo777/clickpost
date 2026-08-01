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
 * `connected`/`syncing`/`expired` restent valides pour une future intégration OAuth/API réelle,
 * mais ne sont plus jamais posés par l'application aujourd'hui — seul `profile_only` (« Profil
 * renseigné — connexion API non configurée ») est écrit par l'interface actuelle. Ne jamais
 * afficher `connected` sans une véritable confirmation OAuth/API.
 */
export type AccountStatus = "connected" | "disconnected" | "expired" | "error" | "syncing" | "profile_only";

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
  permissions: string[];
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  change: number;
}
