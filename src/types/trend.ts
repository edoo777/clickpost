import type { SocialPlatform } from "@/types/dashboard";

/**
 * Catégories de tendances réellement collectées en MVP. La musique est volontairement absente :
 * aucun fournisseur légal et accessible n'a été identifié à l'audit — voir MusicTrendsSection.
 */
export type TrendCategory = "youtube_video" | "platform_news";

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
 * Contrat prévu pour une future intégration musicale — aucune implémentation en MVP, aucun
 * fournisseur légal et accessible identifié à l'audit. Ne sert qu'à fixer la forme attendue.
 */
export interface MusicTrendItem {
  id: string;
  providerId: string;
  platform: SocialPlatform;
  title: string;
  artist?: string;
  url: string;
  collectedAt: string;
  commercialUseNote: string;
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
