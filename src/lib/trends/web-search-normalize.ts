import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import type { CorroboratingSource, TrendClaimType, TrendConfidenceLevel, TrendSourceCategory } from "@/types/trend";

/**
 * Logique pure de vérification/normalisation des résultats de veille Web — séparée du fournisseur
 * (anthropic-web-trend-provider.ts) pour rester testable indépendamment de tout appel réseau.
 * Applique mécaniquement, côté code, les règles de fiabilité demandées : aucune confiance
 * "Très élevée" sans source officielle vérifiée, aucune "Élevée" sans recoupement vérifié,
 * aucune URL affichée si elle n'a pas réellement été vue dans un résultat de recherche.
 */

export interface RawWebTrendItem {
  platform?: unknown;
  title?: unknown;
  summary?: unknown;
  sourceUrl?: unknown;
  sourceName?: unknown;
  sourceType?: unknown;
  confidenceLevel?: unknown;
  claimType?: unknown;
  publishedAt?: unknown;
  relevanceJustification?: unknown;
  corroboratingSourceUrls?: unknown;
}

export interface VerifiedSearchResult {
  url: string;
  title: string;
  pageAge?: string;
}

export function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/**
 * Collecte tous les résultats de recherche réellement renvoyés par l'API Anthropic dans une
 * réponse — sert de base de vérité pour rejeter toute URL que Claude prétendrait avoir trouvée
 * sans qu'elle apparaisse réellement dans un `web_search_tool_result`.
 */
export function collectVerifiedSearchResults(content: ContentBlock[]): Map<string, VerifiedSearchResult> {
  const verified = new Map<string, VerifiedSearchResult>();
  for (const block of content) {
    if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
    for (const result of block.content) {
      verified.set(normalizeUrlKey(result.url), {
        url: result.url,
        title: result.title,
        pageAge: result.page_age ?? undefined,
      });
    }
  }
  return verified;
}

const VALID_SOURCE_TYPES: TrendSourceCategory[] = ["official", "specialized", "web_signal"];
const VALID_CLAIM_TYPES: TrendClaimType[] = [
  "confirmed_trend",
  "emerging_signal",
  "official_info",
  "news",
  "unconfirmed_observation",
  "claude_advice",
];

/** "Très élevée" réservée aux sources officielles ; "Élevée" exige au moins une source
 * corroborante réellement vérifiée ; jamais dérivée de l'auto-évaluation de Claude. */
export function normalizeConfidence(sourceType: TrendSourceCategory, verifiedCorroboratingCount: number): TrendConfidenceLevel {
  if (sourceType === "official") return "very_high";
  if (verifiedCorroboratingCount >= 1) return "high";
  if (sourceType === "specialized") return "medium";
  return "low";
}

/** Empêche un signal de confiance faible d'être présenté comme un fait établi, quelle que soit
 * la classification proposée par Claude. */
export function normalizeClaimType(confidenceLevel: TrendConfidenceLevel, claimedType: TrendClaimType): TrendClaimType {
  if (confidenceLevel === "low" && (claimedType === "confirmed_trend" || claimedType === "official_info")) {
    return "unconfirmed_observation";
  }
  return claimedType;
}

export interface VerifiedWebTrendItem {
  title: string;
  summary?: string;
  platform?: string;
  publishedAt?: string;
  relevanceJustification?: string;
  sourceUrl: string;
  sourceName: string;
  pageAge?: string;
  sourceType: TrendSourceCategory;
  confidenceLevel: TrendConfidenceLevel;
  claimType: TrendClaimType;
  corroboratingSources: CorroboratingSource[];
}

/**
 * Valide et enrichit un item brut renvoyé par Claude contre les résultats de recherche
 * réellement obtenus — retourne `null` (rejet silencieux, jamais affiché) si l'URL source
 * prétendue n'a jamais été vue dans un vrai résultat de recherche. C'est l'application concrète,
 * au niveau code et non simple instruction de prompt, de "Claude ne peut pas inventer une source".
 */
export function verifyAndNormalizeItem(
  raw: RawWebTrendItem,
  verifiedResults: Map<string, VerifiedSearchResult>
): VerifiedWebTrendItem | null {
  if (typeof raw.sourceUrl !== "string" || typeof raw.title !== "string" || raw.title.trim().length === 0) return null;

  const matched = verifiedResults.get(normalizeUrlKey(raw.sourceUrl));
  if (!matched) return null;

  const corroboratingUrls = Array.isArray(raw.corroboratingSourceUrls)
    ? raw.corroboratingSourceUrls.filter((url): url is string => typeof url === "string")
    : [];
  const corroboratingSources: CorroboratingSource[] = corroboratingUrls
    .map((url) => verifiedResults.get(normalizeUrlKey(url)))
    .filter((entry): entry is VerifiedSearchResult => Boolean(entry) && entry!.url !== matched.url)
    .map((entry) => ({ url: entry.url, title: entry.title }));

  const sourceType: TrendSourceCategory =
    typeof raw.sourceType === "string" && VALID_SOURCE_TYPES.includes(raw.sourceType as TrendSourceCategory)
      ? (raw.sourceType as TrendSourceCategory)
      : "web_signal";
  const confidenceLevel = normalizeConfidence(sourceType, corroboratingSources.length);
  const claimedType: TrendClaimType =
    typeof raw.claimType === "string" && VALID_CLAIM_TYPES.includes(raw.claimType as TrendClaimType)
      ? (raw.claimType as TrendClaimType)
      : "unconfirmed_observation";

  let sourceName = matched.title;
  if (typeof raw.sourceName === "string" && raw.sourceName.trim().length > 0) sourceName = raw.sourceName.trim();
  else {
    try {
      sourceName = new URL(matched.url).hostname;
    } catch {
      sourceName = matched.title;
    }
  }

  return {
    title: raw.title.trim(),
    summary: typeof raw.summary === "string" ? raw.summary.trim() : undefined,
    platform: typeof raw.platform === "string" ? raw.platform : undefined,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : undefined,
    relevanceJustification: typeof raw.relevanceJustification === "string" ? raw.relevanceJustification.trim() : undefined,
    sourceUrl: matched.url,
    sourceName,
    pageAge: matched.pageAge,
    sourceType,
    confidenceLevel,
    claimType: normalizeClaimType(confidenceLevel, claimedType),
    corroboratingSources,
  };
}

export interface RawWebMusicItem {
  platform?: unknown;
  title?: unknown;
  artist?: unknown;
  region?: unknown;
  sourceUrl?: unknown;
  sourceName?: unknown;
  sourceType?: unknown;
  observedAt?: unknown;
  note?: unknown;
  corroboratingSourceUrls?: unknown;
}

export interface VerifiedWebMusicItem {
  title: string;
  artist?: string;
  region?: string;
  platform?: string;
  observedAt?: string;
  note?: string;
  sourceUrl: string;
  sourceName: string;
  sourceType: TrendSourceCategory;
  confidenceLevel: TrendConfidenceLevel;
}

/** Même principe de vérification que verifyAndNormalizeItem, adapté à la forme "Musiques et
 * sons" (artiste/région/date d'observation plutôt que résumé/justification de pertinence). */
export function verifyAndNormalizeMusicItem(
  raw: RawWebMusicItem,
  verifiedResults: Map<string, VerifiedSearchResult>
): VerifiedWebMusicItem | null {
  if (typeof raw.sourceUrl !== "string" || typeof raw.title !== "string" || raw.title.trim().length === 0) return null;

  const matched = verifiedResults.get(normalizeUrlKey(raw.sourceUrl));
  if (!matched) return null;

  const corroboratingCount = Array.isArray(raw.corroboratingSourceUrls)
    ? raw.corroboratingSourceUrls.filter(
        (url): url is string => typeof url === "string" && verifiedResults.has(normalizeUrlKey(url)) && normalizeUrlKey(url) !== normalizeUrlKey(matched.url)
      ).length
    : 0;

  const sourceType: TrendSourceCategory =
    typeof raw.sourceType === "string" && VALID_SOURCE_TYPES.includes(raw.sourceType as TrendSourceCategory)
      ? (raw.sourceType as TrendSourceCategory)
      : "web_signal";

  let sourceName = matched.title;
  if (typeof raw.sourceName === "string" && raw.sourceName.trim().length > 0) sourceName = raw.sourceName.trim();
  else {
    try {
      sourceName = new URL(matched.url).hostname;
    } catch {
      sourceName = matched.title;
    }
  }

  return {
    title: raw.title.trim(),
    artist: typeof raw.artist === "string" && raw.artist.trim().length > 0 ? raw.artist.trim() : undefined,
    region: typeof raw.region === "string" && raw.region.trim().length > 0 ? raw.region.trim() : undefined,
    platform: typeof raw.platform === "string" ? raw.platform : undefined,
    observedAt: typeof raw.observedAt === "string" ? raw.observedAt : undefined,
    note: typeof raw.note === "string" ? raw.note.trim() : undefined,
    sourceUrl: matched.url,
    sourceName,
    sourceType,
    confidenceLevel: normalizeConfidence(sourceType, corroboratingCount),
  };
}
