import type { SocialPlatform } from "@/types/dashboard";
import type { CorroboratingSource, TrendClaimType, TrendConfidenceLevel, TrendSourceCategory } from "@/types/trend";

/** Forme normalisée partagée par TrendCard, quelle que soit la source d'origine (TrendItem
 * YouTube ou PlatformNewsItem) — chaque section construit ceci à partir des données réellement
 * reçues, jamais de champ complété par une valeur devinée. */
export interface DisplayableTrend {
  id: string;
  provider: string;
  externalId?: string;
  platform: SocialPlatform;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  metaLines: string[];
  sourceName: string;
  sourceUrl?: string;
  collectedAt: string;
  publishedAt?: string;
  /** Présents uniquement pour les résultats de veille Web (AnthropicWebTrendProvider). */
  sourceCategory?: TrendSourceCategory;
  confidenceLevel?: TrendConfidenceLevel;
  claimType?: TrendClaimType;
  searchedAt?: string;
  corroboratingSources?: CorroboratingSource[];
  relevanceJustification?: string;
}
