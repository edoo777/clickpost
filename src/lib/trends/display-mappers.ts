import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import type { TrendFilters } from "@/components/trends/TrendsFilterBar";
import type { MusicTrendItem, PlatformNewsItem, TrendItem } from "@/types/trend";

function externalIdFromCompositeId(id: string): string {
  const separatorIndex = id.indexOf(":");
  return separatorIndex === -1 ? id : id.slice(separatorIndex + 1);
}

export function trendItemToDisplayable(item: TrendItem): DisplayableTrend {
  const metaLines: string[] = [];
  if (item.channelName) metaLines.push(item.channelName);
  if (item.country) metaLines.push(item.country);
  if (typeof item.stats?.vues === "number") metaLines.push(`${item.stats.vues.toLocaleString("fr-CA")} vues`);
  if (typeof item.stats?.mentionsJaime === "number") metaLines.push(`${item.stats.mentionsJaime.toLocaleString("fr-CA")} mentions J'aime`);

  return {
    id: item.id,
    provider: item.providerId,
    externalId: externalIdFromCompositeId(item.id),
    platform: item.platform,
    title: item.title,
    description: item.description,
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    metaLines,
    sourceName: "YouTube Data API v3",
    sourceUrl: "https://www.youtube.com",
    collectedAt: item.collectedAt,
    publishedAt: item.publishedAt,
  };
}

/** TrendItem issu de AnthropicWebTrendProvider (category "web_signal") — distinct de
 * trendItemToDisplayable (réservée à YouTube) car la source/le badge/la justification diffèrent
 * entièrement. Jamais utilisée pour un item YouTube, jamais l'inverse. */
export function webTrendItemToDisplayable(item: TrendItem): DisplayableTrend {
  return {
    id: item.id,
    provider: item.providerId,
    externalId: externalIdFromCompositeId(item.id),
    platform: item.platform,
    title: item.title,
    description: item.description,
    url: item.url,
    metaLines: [],
    sourceName: item.webSearch ? sourceNameFromUrl(item.url) : "Veille Web",
    sourceUrl: item.url,
    collectedAt: item.collectedAt,
    publishedAt: item.publishedAt,
    sourceCategory: item.webSearch?.sourceCategory,
    confidenceLevel: item.webSearch?.confidenceLevel,
    claimType: item.webSearch?.claimType,
    searchedAt: item.webSearch?.searchedAt,
    corroboratingSources: item.webSearch?.corroboratingSources,
    relevanceJustification: item.webSearch?.relevanceJustification,
  };
}

export function musicItemToDisplayable(item: MusicTrendItem): DisplayableTrend {
  const metaLines: string[] = [];
  if (item.artist) metaLines.push(item.artist);
  if (item.region) metaLines.push(item.region);

  return {
    id: item.id,
    provider: item.providerId,
    externalId: externalIdFromCompositeId(item.id),
    platform: item.platform,
    title: item.title,
    description: item.note ?? item.commercialUseNote,
    url: item.url,
    metaLines,
    sourceName: item.sourceName,
    sourceUrl: item.url,
    collectedAt: item.collectedAt,
    publishedAt: item.observedAt,
    sourceCategory: item.sourceCategory,
    confidenceLevel: item.confidenceLevel,
  };
}

function sourceNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Veille Web";
  }
}

const NO_CLEAN_DESCRIPTION_FALLBACK = "Consultez la source officielle pour lire l'annonce complète.";

export function newsItemToDisplayable(item: PlatformNewsItem): DisplayableTrend {
  return {
    id: item.id,
    provider: item.providerId,
    externalId: externalIdFromCompositeId(item.id),
    platform: item.platform,
    title: item.title,
    description: item.summary && item.summary.trim().length > 0 ? item.summary : NO_CLEAN_DESCRIPTION_FALLBACK,
    url: item.url,
    thumbnailUrl: item.imageUrl,
    metaLines: [],
    sourceName: item.sourceName,
    sourceUrl: item.url,
    collectedAt: item.collectedAt,
    publishedAt: item.publishedAt,
  };
}

/**
 * Déduplique une liste combinée provenant de plusieurs sections/plateformes (ex. le même
 * communiqué Meta Newsroom listé à la fois sous Instagram et Facebook) — nécessaire uniquement
 * là où plusieurs listes déjà distinctes sont aplaties en une seule (Vue d'ensemble, Conseils
 * personnalisés). Ne modifie aucune donnée, ne fait que retirer les entrées dont l'identité
 * canonique (id) est déjà présente ; la première occurrence rencontrée est conservée.
 */
export function dedupeDisplayable(items: DisplayableTrend[]): DisplayableTrend[] {
  const seen = new Set<string>();
  const result: DisplayableTrend[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

const PERIOD_MS: Record<string, number> = {
  "24h": 24 * 60 * 60_000,
  "7d": 7 * 24 * 60 * 60_000,
  "30d": 30 * 24 * 60 * 60_000,
};

/**
 * Filtres réellement appliqués côté client : plateforme, source et période (champs sans
 * ambiguïté). La niche/thématique n'y participe jamais comme filtre strict — une simple
 * correspondance textuelle serait trompeuse ; elles ne servent qu'au contexte envoyé à Claude
 * et à la mise en avant, clairement annoncée comme telle, dans la Vue d'ensemble.
 */
export function applyClientFilters(items: DisplayableTrend[], filters: TrendFilters): DisplayableTrend[] {
  return items.filter((item) => {
    if (filters.platform !== "all" && item.platform !== filters.platform) return false;
    if (filters.source !== "all" && item.provider !== filters.source) return false;
    if (filters.period !== "all" && item.publishedAt) {
      const ageMs = Date.now() - new Date(item.publishedAt).getTime();
      const maxAgeMs = PERIOD_MS[filters.period];
      if (maxAgeMs && ageMs > maxAgeMs) return false;
    }
    return true;
  });
}
