import type { SocialPlatform } from "@/types/dashboard";

/** D'où vient un point de mesure — jamais implicite. "imported" = saisi/téléversé par un humain
 * depuis un export réel de plateforme (CSV) ; "demo" = généré pour illustrer l'interface, jamais
 * affiché sans activation explicite. Aucun fournisseur de statistiques réel n'existe encore dans
 * ce projet (voir src/lib/analytics/stats-providers.ts) — la valeur "real" sera ajoutée le jour où
 * l'un d'eux existera réellement, pas avant. */
export type MetricsSource = "imported" | "demo";

export interface MetricValues {
  impressions: number;
  reach: number;
  views: number;
  interactions: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  newFollowers: number;
  conversions: number;
}

export interface PublicationPerformance extends MetricValues {
  publicationId: string;
  source: MetricsSource;
}

export interface DailyMetricPoint extends MetricValues {
  date: string;
  brand: string;
  platform: SocialPlatform;
  source: MetricsSource;
}

/** Une ligne de métriques importée manuellement (CSV) pour une publication précise — la seule
 * source de données non fictive possible aujourd'hui, tant qu'aucun fournisseur d'API social
 * réel n'est configuré. La plus récente importation pour une publication remplace la précédente
 * (jamais cumulée silencieusement). */
export interface ImportedMetricRecord extends MetricValues {
  id: string;
  publicationId: string;
  importedAt: string;
  importedBy: string;
  sourceFileName?: string;
}

export const EMPTY_METRICS: MetricValues = {
  impressions: 0,
  reach: 0,
  views: 0,
  interactions: 0,
  reactions: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  clicks: 0,
  newFollowers: 0,
  conversions: 0,
};
