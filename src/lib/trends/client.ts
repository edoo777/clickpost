import type { SocialPlatform } from "@/types/dashboard";
import type { PlatformNewsItem, ProviderResult, TrendItem } from "@/types/trend";

/**
 * Appels client vers /api/ia/tendances/* — jamais d'appel direct à un fournisseur externe ni à
 * Claude depuis le navigateur (même règle que banque-quick-action.ts).
 */

export type CachedResult<T> = ProviderResult<T> & { cacheAgeMs: number };

export async function fetchYoutubeTrends(options: { country?: string; refresh?: boolean } = {}): Promise<CachedResult<TrendItem>> {
  const params = new URLSearchParams();
  if (options.country) params.set("country", options.country);
  if (options.refresh) params.set("refresh", "1");
  try {
    const response = await fetch(`/api/ia/tendances/youtube?${params.toString()}`);
    const data = (await response.json().catch(() => null)) as CachedResult<TrendItem> | { status: "error"; message: string } | null;
    if (!data) return { status: "error", items: [], collectedAt: new Date().toISOString(), sourceName: "YouTube Data API v3", message: "Réponse invalide.", cacheAgeMs: 0 };
    if (data.status === "error" && !("items" in data)) {
      return { status: "error", items: [], collectedAt: new Date().toISOString(), sourceName: "YouTube Data API v3", message: data.message, cacheAgeMs: 0 };
    }
    return data as CachedResult<TrendItem>;
  } catch {
    return { status: "error", items: [], collectedAt: new Date().toISOString(), sourceName: "YouTube Data API v3", message: "Connexion impossible.", cacheAgeMs: 0 };
  }
}

export interface PlatformNewsResponse {
  status: "ok" | "error";
  collectedAt: string;
  platforms: Partial<Record<SocialPlatform, CachedResult<PlatformNewsItem>>>;
  message?: string;
}

export async function fetchPlatformNews(options: { refresh?: boolean } = {}): Promise<PlatformNewsResponse> {
  const params = new URLSearchParams();
  if (options.refresh) params.set("refresh", "1");
  try {
    const response = await fetch(`/api/ia/tendances/news?${params.toString()}`);
    const data = (await response.json().catch(() => null)) as PlatformNewsResponse | null;
    if (!data) return { status: "error", collectedAt: new Date().toISOString(), platforms: {}, message: "Réponse invalide." };
    return data;
  } catch {
    return { status: "error", collectedAt: new Date().toISOString(), platforms: {}, message: "Connexion impossible." };
  }
}

export interface TrendAnalysisInput {
  title: string;
  summary?: string;
  platform?: SocialPlatform;
  sourceName: string;
  sourceUrl: string;
  brandName?: string;
  niche?: string;
  themeLabels?: string[];
}

export interface TrendAnalysisResult {
  relevance: string;
  targetBrand: string;
  suggestedContentTypes: string[];
  suggestedFormats: string[];
  suggestedPlatform: string;
  risks: string;
}

export type TrendAnalysisOutcome =
  | { status: "ok"; analysis: TrendAnalysisResult }
  | { status: "error"; code: string; message: string };

export async function runTrendAnalysis(input: TrendAnalysisInput): Promise<TrendAnalysisOutcome> {
  try {
    const response = await fetch("/api/ia/tendances/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => null)) as TrendAnalysisOutcome | null;
    if (!data || data.status !== "ok") {
      return { status: "error", code: (data as { code?: string })?.code ?? `http_${response.status}`, message: (data as { message?: string })?.message ?? "Erreur inconnue." };
    }
    return data;
  } catch {
    return { status: "error", code: "network_error", message: "Connexion impossible — vérifiez votre réseau." };
  }
}
