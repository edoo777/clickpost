import type { SocialPlatform } from "@/types/dashboard";
import type { MusicTrendItem, PlatformNewsItem, ProviderResult, TrendItem, WebSearchQuotaStatus, WebSearchUsageSnapshot } from "@/types/trend";

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

export interface WebTrendSearchInput {
  mode: "global" | "targeted";
  focus: "platform_trends" | "music";
  platform?: SocialPlatform;
  platforms?: SocialPlatform[];
  niche?: string;
  themeLabels?: string[];
  country?: string;
  language?: string;
  period: "24h" | "7d" | "30d" | "all";
  refresh?: boolean;
}

export interface WebSearchStatusResponse {
  status: "ok" | "error";
  quota?: WebSearchQuotaStatus;
  usage?: WebSearchUsageSnapshot;
  cachedAvailable?: boolean;
  cachedAgeMs?: number | null;
  message?: string;
}

type WebTrendSearchResult<T> = (CachedResult<T> & { quota?: WebSearchQuotaStatus }) | { status: "quota_exceeded"; message: string; resetAt: string; quota?: WebSearchQuotaStatus };

/** « Rechercher les tendances » / « Rechercher de nouveau » — jamais appelée automatiquement,
 * uniquement au clic explicite (voir WebSearchTrigger.tsx). */
export async function runWebTrendSearch(input: WebTrendSearchInput): Promise<WebTrendSearchResult<TrendItem | MusicTrendItem>> {
  try {
    const response = await fetch("/api/ia/tendances/web-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json().catch(() => null);
    if (!data) {
      return { status: "error", items: [], collectedAt: new Date().toISOString(), sourceName: "Veille Web", message: "Réponse invalide.", cacheAgeMs: 0 };
    }
    return data as WebTrendSearchResult<TrendItem | MusicTrendItem>;
  } catch {
    return { status: "error", items: [], collectedAt: new Date().toISOString(), sourceName: "Veille Web", message: "Connexion impossible.", cacheAgeMs: 0 };
  }
}

/** Statut de quota/cache sans jamais déclencher de recherche — pour l'affichage avant clic. */
export async function fetchWebSearchStatus(input: Omit<WebTrendSearchInput, "refresh">): Promise<WebSearchStatusResponse> {
  const params = new URLSearchParams();
  params.set("mode", input.mode);
  params.set("focus", input.focus);
  if (input.platform) params.set("platform", input.platform);
  if (input.platforms) params.set("platforms", input.platforms.join(","));
  if (input.niche) params.set("niche", input.niche);
  if (input.themeLabels && input.themeLabels.length > 0) params.set("themeLabels", input.themeLabels.join("|"));
  if (input.country) params.set("country", input.country);
  if (input.language) params.set("language", input.language);
  params.set("period", input.period);
  try {
    const response = await fetch(`/api/ia/tendances/web-search?${params.toString()}`);
    const data = (await response.json().catch(() => null)) as WebSearchStatusResponse | null;
    return data ?? { status: "error", message: "Réponse invalide." };
  } catch {
    return { status: "error", message: "Connexion impossible." };
  }
}

/** « Signaler une information incorrecte » — journalisée côté serveur (voir limites connues). */
export async function reportIncorrectInformation(input: { itemId: string; sourceUrl: string; reason?: string }): Promise<{ status: "ok" | "error"; message?: string }> {
  try {
    const response = await fetch("/api/ia/tendances/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => null)) as { status: "ok" | "error"; message?: string } | null;
    return data ?? { status: "error", message: "Réponse invalide." };
  } catch {
    return { status: "error", message: "Connexion impossible." };
  }
}
