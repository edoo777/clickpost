import type { TrendFetchParams, TrendProvider } from "@/lib/trends/provider";
import type { ProviderResult, TrendItem } from "@/types/trend";

/**
 * YouTube Data API v3 — `videos.list?chart=mostPopular`, officiellement documentée, gratuite
 * (quota journalier), usage commercial autorisé avec attribution. Jamais d'appel si la clé n'est
 * pas configurée : voir isYoutubeConfigured(). La variable exacte, l'emplacement de création de
 * la clé et les restrictions recommandées sont documentés dans .env.example et ont été présentés
 * avant tout premier appel réel (voir rapport de livraison).
 */

const FETCH_TIMEOUT_MS = 8000;
const DEFAULT_REGION = "CA";
const MAX_RESULTS = 20;
const API_URL = "https://www.googleapis.com/youtube/v3/videos";

export function isYoutubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

interface YoutubeVideoSnippet {
  title: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
  categoryId?: string;
  thumbnails?: { medium?: { url: string }; default?: { url: string } };
}

interface YoutubeVideoStatistics {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

interface YoutubeVideoResource {
  id: string;
  snippet: YoutubeVideoSnippet;
  statistics?: YoutubeVideoStatistics;
}

interface YoutubeListResponse {
  items?: YoutubeVideoResource[];
  error?: { code: number; message: string; errors?: { reason?: string }[] };
}

async function fetchMostPopular(params: TrendFetchParams): Promise<ProviderResult<TrendItem>> {
  const collectedAt = new Date().toISOString();
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      status: "config_missing",
      items: [],
      collectedAt,
      sourceName: "YouTube Data API v3",
      message: "YOUTUBE_API_KEY non configurée sur ce serveur.",
    };
  }

  const regionCode = params.country ?? DEFAULT_REGION;
  const url = new URL(API_URL);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("regionCode", regionCode);
  url.searchParams.set("maxResults", String(MAX_RESULTS));
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    const body = (await response.json().catch(() => null)) as YoutubeListResponse | null;

    if (!response.ok) {
      const reason = body?.error?.errors?.[0]?.reason;
      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        return {
          status: "quota_exceeded",
          items: [],
          collectedAt,
          sourceName: "YouTube Data API v3",
          message: "Quota YouTube Data API dépassé pour aujourd'hui.",
        };
      }
      return {
        status: "error",
        items: [],
        collectedAt,
        sourceName: "YouTube Data API v3",
        message: body?.error?.message ?? `Erreur YouTube Data API (statut ${response.status}).`,
      };
    }

    const items: TrendItem[] = (body?.items ?? []).map((video) => {
      const stats: Record<string, string | number> = {};
      if (video.statistics?.viewCount) stats.vues = Number(video.statistics.viewCount);
      if (video.statistics?.likeCount) stats.mentionsJaime = Number(video.statistics.likeCount);
      if (video.statistics?.commentCount) stats.commentaires = Number(video.statistics.commentCount);

      return {
        id: `youtube:${video.id}`,
        providerId: "youtube-api",
        category: "youtube_video",
        platform: "youtube",
        title: video.snippet.title,
        description: video.snippet.description?.slice(0, 400),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnailUrl: video.snippet.thumbnails?.medium?.url ?? video.snippet.thumbnails?.default?.url,
        channelName: video.snippet.channelTitle,
        country: regionCode,
        publishedAt: video.snippet.publishedAt,
        collectedAt,
        stats: Object.keys(stats).length > 0 ? stats : undefined,
      };
    });

    return { status: "ok", items, collectedAt, sourceName: "YouTube Data API v3", sourceUrl: "https://www.youtube.com" };
  } catch (error) {
    return {
      status: "error",
      items: [],
      collectedAt,
      sourceName: "YouTube Data API v3",
      message: error instanceof Error && error.name === "AbortError" ? "Délai d'attente dépassé." : "YouTube Data API injoignable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const youtubeTrendProvider: TrendProvider = {
  id: "youtube-api",
  name: "YouTube Data API v3",
  type: "official_api",
  platforms: ["youtube"],
  fetchTrends: fetchMostPopular,
};
