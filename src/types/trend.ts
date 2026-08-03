import type { SocialPlatform } from "@/types/dashboard";

/**
 * Catégories de tendances réellement collectées en MVP. `web_signal` = résultat de veille Web
 * (Claude + outil web_search officiel Anthropic), utilisé uniquement quand aucune source
 * officielle n'est disponible et après déclenchement explicite — voir anthropic-web-trend-provider.ts.
 */
export type TrendCategory = "youtube_video" | "platform_news" | "web_signal";

/** Catégorie de source, au sens de la hiérarchie de collecte (niveau 1/2/3). */
export type TrendSourceCategory = "official" | "specialized" | "web_signal";

/**
 * Dérivé mécaniquement côté serveur à partir de sourceCategory + nombre de sources
 * corroborantes vérifiées — jamais depuis la simple auto-évaluation de Claude. Voir
 * `normalizeConfidence` dans anthropic-web-trend-provider.ts.
 */
export type TrendConfidenceLevel = "very_high" | "high" | "medium" | "low";

export type TrendClaimType =
  | "confirmed_trend"
  | "emerging_signal"
  | "official_info"
  | "news"
  | "unconfirmed_observation"
  | "claude_advice";

export interface CorroboratingSource {
  url: string;
  title: string;
}

/**
 * Champs additifs, présents uniquement sur les éléments issus de la veille Web — tous les
 * fournisseurs existants (YouTube, flux officiels) continuent de fonctionner sans jamais les
 * renseigner.
 */
export interface WebSearchFields {
  sourceCategory: TrendSourceCategory;
  confidenceLevel: TrendConfidenceLevel;
  claimType: TrendClaimType;
  /** Date/heure de la recherche elle-même — distincte de `publishedAt` (date de l'article) et de
   * `collectedAt` (mise en cache) : jamais présentée comme « temps réel ». */
  searchedAt: string;
  /** `page_age` brut renvoyé par l'API Anthropic (dernière mise à jour connue de la page). */
  pageAge?: string;
  /** Sources supplémentaires réellement vues dans les résultats de recherche (jamais inventées)
   * qui corroborent la même information — condition du niveau de confiance "Élevée". */
  corroboratingSources: CorroboratingSource[];
  relevanceJustification?: string;
}

/**
 * Donnée éphémère provenant d'un TrendProvider — jamais écrite dans Supabase, uniquement en
 * cache serveur (voir lib/trends/cache.ts). Seule SavedTrend, créée explicitement par
 * l'utilisateur via l'action « Enregistrer », est persistée.
 */
export interface TrendItem {
  /** Déterministe : `${providerId}:${externalId}` — jamais un UUID aléatoire (permet la
   * dé-duplication entre deux collectes successives). */
  id: string;
  providerId: string;
  category: TrendCategory;
  platform: SocialPlatform;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  channelName?: string;
  country?: string;
  publishedAt?: string;
  collectedAt: string;
  /** Statistiques réellement renvoyées par la source (vues, mentions J'aime…) — jamais
   * complétées ni estimées lorsqu'absentes. */
  stats?: Record<string, string | number>;
  /** Présent uniquement pour category === "web_signal". */
  webSearch?: WebSearchFields;
}

export interface PlatformNewsItem {
  id: string;
  providerId: string;
  platform: SocialPlatform;
  title: string;
  summary?: string;
  /** Extraite et validée depuis le flux (URL http(s) absolue uniquement) — jamais de HTML brut,
   * jamais de balise <img> rendue telle quelle. */
  imageUrl?: string;
  url: string;
  publishedAt?: string;
  collectedAt: string;
  sourceName: string;
}

/**
 * Résultat "Musiques et sons" — via veille Web uniquement (aucun fournisseur officiel légal et
 * accessible identifié à l'audit). Jamais de volume/classement inventé ; `commercialUseNote`
 * porte toujours la mention de vérification des droits, jamais une affirmation d'autorisation.
 */
export interface MusicTrendItem {
  id: string;
  providerId: string;
  platform: SocialPlatform;
  title: string;
  artist?: string;
  region?: string;
  url: string;
  sourceName: string;
  observedAt?: string;
  /** Observation textuelle vérifiée (jamais un volume/classement inventé) — distincte de
   * `commercialUseNote`, qui reste toujours la mention fixe de vérification des droits. */
  note?: string;
  collectedAt: string;
  commercialUseNote: string;
  sourceCategory: TrendSourceCategory;
  confidenceLevel: TrendConfidenceLevel;
}

export type ProviderResultStatus = "ok" | "config_missing" | "quota_exceeded" | "unavailable" | "error";

/** Enveloppe uniforme retournée par chaque TrendProvider — jamais de données simulées en cas
 * d'erreur : `items` reste vide et `status`/`message` expliquent honnêtement l'état. */
export interface ProviderResult<T> {
  status: ProviderResultStatus;
  items: T[];
  collectedAt: string;
  sourceName: string;
  sourceUrl?: string;
  message?: string;
}

export type SavedTrendStatus = "saved" | "hidden" | "not_relevant";

/**
 * Seule entité de tendance persistée dans Supabase — créée uniquement par une action explicite
 * de l'utilisateur (Enregistrer / Masquer / Non pertinente), jamais automatiquement.
 */
export interface SavedTrend {
  id: string;
  workspaceId: string;
  brandId?: string;
  provider: string;
  externalId?: string;
  title: string;
  sourceUrl: string;
  notes?: string;
  status: SavedTrendStatus;
  savedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrendFilterContext {
  brandId?: string;
  niche?: string;
  themeLabels: string[];
  market?: string;
  platforms: SocialPlatform[];
}

/** Une fenêtre de quota, retournée sans jamais exposer de secret ni de coût monétaire exact —
 * uniquement des compteurs et des horodatages. Voir lib/trends/web-search-quota.ts. */
export interface QuotaWindowStatus {
  remaining: number;
  limit: number;
  resetAt: string;
}

/**
 * Statut de quota de veille Web pour le workspace/l'utilisateur courant — utilisé pour afficher
 * "prochaine recherche disponible dans..." sans jamais bloquer la consultation du cache déjà
 * présent. Trois fenêtres indépendantes (globale/workspace, ciblée/workspace, ciblée/utilisateur) :
 * une recherche n'est autorisée que si toutes les fenêtres pertinentes le permettent.
 */
export interface WebSearchQuotaStatus {
  global: QuotaWindowStatus;
  targetedWorkspace: QuotaWindowStatus;
  targetedUser: QuotaWindowStatus;
}

/**
 * Suivi d'utilisation sans coût monétaire exact (l'API ne le fournit pas directement) — compteurs
 * uniquement, remis à zéro chaque jour. Une estimation en dollars, si affichée côté interface,
 * doit être calculée côté client à partir de ces compteurs et documentée comme une estimation.
 */
export interface WebSearchUsageSnapshot {
  searchesUsedToday: number;
  cacheHitsToday: number;
  providerErrorsToday: number;
  lastResetAt: string;
}
