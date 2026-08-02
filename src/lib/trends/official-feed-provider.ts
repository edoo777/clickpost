import { createHash } from "node:crypto";
import type { SocialPlatform } from "@/types/dashboard";
import type { TrendFetchParams, TrendProvider } from "@/lib/trends/provider";
import { parseRssItems } from "@/lib/trends/rss-parser";
import type { PlatformNewsItem, ProviderResult } from "@/types/trend";

const FETCH_TIMEOUT_MS = 8000;
const MAX_ITEMS_PER_FEED = 15;

interface FeedConfig {
  url: string;
  sourceName: string;
}

/**
 * Chaque URL a été vérifiée manuellement (requête réelle, contenu RSS 2.0 confirmé) avant d'être
 * ajoutée ici — jamais devinée à partir d'une convention de nommage. Les plateformes absentes de
 * cette liste n'ont, à ce jour, aucune source officielle publique et fiable connue : TikTok
 * Newsroom, LinkedIn et X ne publient aucun flux RSS officiel identifiable ; Threads n'a pas de
 * blog dédié (ses annonces sont relayées via Meta Newsroom, sans balisage propre à la plateforme).
 * Une plateforme sans entrée ici affiche honnêtement « Aucune source officielle configurée »
 * plutôt qu'un flux tiers ou deviné.
 */
const OFFICIAL_FEEDS: Partial<Record<SocialPlatform, FeedConfig>> = {
  youtube: { url: "https://blog.youtube/rss/", sourceName: "Blog officiel YouTube" },
  instagram: { url: "https://about.fb.com/feed/", sourceName: "Meta Newsroom (Facebook et Instagram)" },
  facebook: { url: "https://about.fb.com/feed/", sourceName: "Meta Newsroom (Facebook et Instagram)" },
  pinterest: { url: "https://newsroom.pinterest.com/en/feed/news.xml", sourceName: "Pinterest Newsroom" },
};

/**
 * Empreinte déterministe fondée sur la source, l'URL canonique de l'article et sa date de
 * publication (au minimum) — jamais un simple hachage court de l'URL seule (risque de collision
 * non négligeable observé en production, ex. deux articles distincts réduits à la même clé
 * `official-feed:q29k3w`). SHA-256 tronqué : collision pratiquement nulle même sur un grand
 * volume d'articles, tout en gardant un identifiant court et stable.
 */
function canonicalFingerprint(parts: (string | undefined)[]): string {
  const normalized = parts.map((part) => (part ?? "").trim()).join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 20);
}

function safeIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

async function fetchFeedNews(platform: SocialPlatform): Promise<ProviderResult<PlatformNewsItem>> {
  const collectedAt = new Date().toISOString();
  const config = OFFICIAL_FEEDS[platform];
  if (!config) {
    return {
      status: "unavailable",
      items: [],
      collectedAt,
      sourceName: "Aucune source officielle configurée",
      message: "Aucune source officielle, publique et fiable n'a été identifiée pour cette plateforme.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(config.url, { signal: controller.signal, headers: { "User-Agent": "ClickPost/1.0" } });
    if (!response.ok) {
      return {
        status: "error",
        items: [],
        collectedAt,
        sourceName: config.sourceName,
        sourceUrl: config.url,
        message: `Le flux officiel a répondu avec le statut ${response.status}.`,
      };
    }
    const xml = await response.text();
    const parsed = parseRssItems(xml, MAX_ITEMS_PER_FEED);

    // Un flux source peut légitimement lister deux fois le même article (republication,
    // article épinglé en plus de sa place chronologique...) — dédupliqué par URL canonique
    // avant affichage, jamais par titre (deux articles distincts peuvent partager un titre
    // proche sans être le même contenu).
    const seenLinks = new Set<string>();
    const uniqueParsed = parsed.filter((entry) => {
      if (seenLinks.has(entry.link)) return false;
      seenLinks.add(entry.link);
      return true;
    });

    const items: PlatformNewsItem[] = uniqueParsed.map((entry) => ({
      id: `official-feed:${canonicalFingerprint([config.sourceName, entry.link, entry.pubDate])}`,
      providerId: "official-feed",
      platform,
      title: entry.title,
      summary: entry.description,
      imageUrl: entry.imageUrl,
      url: entry.link,
      publishedAt: safeIsoDate(entry.pubDate),
      collectedAt,
      sourceName: config.sourceName,
    }));
    return { status: "ok", items, collectedAt, sourceName: config.sourceName, sourceUrl: config.url };
  } catch (error) {
    return {
      status: "error",
      items: [],
      collectedAt,
      sourceName: config.sourceName,
      sourceUrl: config.url,
      message: error instanceof Error && error.name === "AbortError" ? "Délai d'attente dépassé." : "Le flux officiel est injoignable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const officialFeedProvider: TrendProvider = {
  id: "official-feed",
  name: "Flux officiels des plateformes",
  type: "official_feed",
  platforms: ["youtube", "instagram", "facebook", "tiktok", "linkedin", "x", "pinterest", "threads"],
  async fetchNews(params: TrendFetchParams) {
    if (!params.platform) {
      return {
        status: "error",
        items: [],
        collectedAt: new Date().toISOString(),
        sourceName: "Flux officiels",
        message: "Plateforme requise.",
      } satisfies ProviderResult<PlatformNewsItem>;
    }
    return fetchFeedNews(params.platform);
  },
};

export function hasOfficialFeed(platform: SocialPlatform): boolean {
  return Boolean(OFFICIAL_FEEDS[platform]);
}
