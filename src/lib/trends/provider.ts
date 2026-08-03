import type { MusicTrendItem, PlatformNewsItem, ProviderResult, TrendItem } from "@/types/trend";
import type { SocialPlatform } from "@/types/dashboard";

export interface TrendFetchParams {
  platform?: SocialPlatform;
  /** Recherche groupée multi-plateformes (veille Web uniquement) — un fournisseur qui ne la
   * supporte pas l'ignore simplement, jamais une erreur. */
  platforms?: SocialPlatform[];
  country?: string;
  /** Termes de recherche/niche facultatifs — jamais utilisés pour inventer un résultat, un
   * fournisseur qui ne supporte pas la recherche les ignore simplement. */
  query?: string;
  /** Contexte additif réservé à la veille Web (AnthropicWebTrendProvider) — ignoré par les
   * fournisseurs officiels existants (YouTube, flux RSS), qui n'en ont pas besoin. */
  niche?: string;
  themeLabels?: string[];
  language?: string;
  period?: "24h" | "7d" | "30d" | "all";
}

/**
 * Contrat commun à tout fournisseur de tendances — serveur uniquement (jamais importé par un
 * composant "use client"). Un fournisseur qui n'a rien à offrir pour une méthode donnée ne la
 * définit simplement pas, plutôt que de retourner une liste vide déguisée en résultat réel.
 */
export interface TrendProvider {
  id: string;
  name: string;
  type: "official_api" | "official_feed" | "ai_web_search";
  platforms: SocialPlatform[];
  fetchTrends?(params: TrendFetchParams): Promise<ProviderResult<TrendItem>>;
  fetchNews?(params: TrendFetchParams): Promise<ProviderResult<PlatformNewsItem>>;
  fetchMusicTrends?(params: TrendFetchParams): Promise<ProviderResult<MusicTrendItem>>;
}
