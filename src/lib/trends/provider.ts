import type { MusicTrendItem, PlatformNewsItem, ProviderResult, TrendItem } from "@/types/trend";
import type { SocialPlatform } from "@/types/dashboard";

export interface TrendFetchParams {
  platform?: SocialPlatform;
  country?: string;
  /** Termes de recherche/niche facultatifs — jamais utilisés pour inventer un résultat, un
   * fournisseur qui ne supporte pas la recherche les ignore simplement. */
  query?: string;
}

/**
 * Contrat commun à tout fournisseur de tendances — serveur uniquement (jamais importé par un
 * composant "use client"). Un fournisseur qui n'a rien à offrir pour une méthode donnée ne la
 * définit simplement pas, plutôt que de retourner une liste vide déguisée en résultat réel.
 */
export interface TrendProvider {
  id: string;
  name: string;
  type: "official_api" | "official_feed";
  platforms: SocialPlatform[];
  fetchTrends?(params: TrendFetchParams): Promise<ProviderResult<TrendItem>>;
  fetchNews?(params: TrendFetchParams): Promise<ProviderResult<PlatformNewsItem>>;
  fetchMusicTrends?(params: TrendFetchParams): Promise<ProviderResult<MusicTrendItem>>;
}
