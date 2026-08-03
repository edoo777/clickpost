import { createHash } from "node:crypto";
import type { ContentBlock, UserLocation } from "@anthropic-ai/sdk/resources/messages";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { buildWebTrendSearchPrompt, type WebTrendSearchPromptInput } from "@/lib/ai/web-trend-search-prompt";
import type { TrendFetchParams, TrendProvider } from "@/lib/trends/provider";
import { findWebSearchToolError } from "@/lib/trends/web-search-error";
import {
  collectVerifiedSearchResults,
  verifyAndNormalizeItem,
  verifyAndNormalizeMusicItem,
  type RawWebMusicItem,
  type RawWebTrendItem,
  type VerifiedSearchResult,
} from "@/lib/trends/web-search-normalize";
import type { MusicTrendItem, ProviderResult, ProviderResultStatus, TrendItem } from "@/types/trend";

/**
 * Fournisseur "Veille Web intelligente" — Claude + outil officiel web_search Anthropic, jamais un
 * scraper maison. N'est JAMAIS invoqué automatiquement : uniquement depuis la route
 * /api/ia/tendances/web-search, elle-même appelée uniquement sur clic explicite (bouton
 * « Rechercher les tendances » / « Rechercher de nouveau »). Respecte le même contrat
 * `TrendProvider` que youtube-provider.ts et official-feed-provider.ts — un seul système
 * Tendances, un troisième fournisseur, jamais une architecture parallèle.
 */

const SOURCE_NAME = "Veille Web vérifiée (Claude + recherche Web Anthropic)";
const MAX_TOKENS = 3000;
const MAX_USES_TARGETED = 2;
const MAX_USES_GLOBAL = 4;
const MAX_ITEMS_PER_PLATFORM = 10;
const MAX_ITEMS_GLOBAL = 30;
const MAX_ITEMS_MUSIC = 10;

function buildUserLocation(country?: string): UserLocation | undefined {
  if (!country) return undefined;
  return { type: "approximate", country };
}

function extractFinalText(content: ContentBlock[]): string | undefined {
  let lastText: string | undefined;
  for (const block of content) {
    if (block.type === "text") lastText = block.text;
  }
  return lastText;
}

function hashId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 20);
}

type SearchOutcome =
  | { status: "ok"; parsed: unknown; verifiedResults: Map<string, VerifiedSearchResult> }
  | { status: Exclude<ProviderResultStatus, "ok">; message: string };

async function runWebSearch(input: WebTrendSearchPromptInput, maxUses: number): Promise<SearchOutcome> {
  if (!isAnthropicConfigured()) {
    return { status: "config_missing", message: "Intégration Claude non configurée sur ce serveur." };
  }

  const client = getAnthropicClient();
  const model = getAnthropicModel();
  const prompt = buildWebTrendSearchPrompt(input);
  const userLocation = buildUserLocation(input.country);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: maxUses,
          ...(userLocation ? { user_location: userLocation } : {}),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { status: "error", message: "Claude a refusé d'effectuer cette recherche." };
    }

    const toolError = findWebSearchToolError(response.content);
    const verifiedResults = collectVerifiedSearchResults(response.content);
    const finalText = extractFinalText(response.content);

    if (!finalText) {
      if (toolError) {
        return { status: toolError.code === "provider_rate_limited" ? "quota_exceeded" : "error", message: toolError.message };
      }
      return { status: "error", message: "Réponse Claude sans contenu texte." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(finalText);
    } catch {
      return { status: "error", message: "Réponse Claude dans un format inattendu." };
    }

    return { status: "ok", parsed, verifiedResults };
  } catch {
    return { status: "error", message: "Le service de recherche Web Anthropic est injoignable." };
  }
}

async function fetchTrends(params: TrendFetchParams): Promise<ProviderResult<TrendItem>> {
  const collectedAt = new Date().toISOString();
  const platforms = params.platforms && params.platforms.length > 0 ? params.platforms : params.platform ? [params.platform] : [];

  if (platforms.length === 0) {
    return { status: "error", items: [], collectedAt, sourceName: SOURCE_NAME, message: "Aucune plateforme fournie." };
  }

  const isGlobal = platforms.length > 1;
  const outcome = await runWebSearch(
    {
      focus: "platform_trends",
      platforms,
      niche: params.niche,
      themeLabels: params.themeLabels ?? [],
      country: params.country,
      language: params.language,
      period: params.period ?? "7d",
    },
    isGlobal ? MAX_USES_GLOBAL : MAX_USES_TARGETED
  );

  if (outcome.status !== "ok") {
    return { status: outcome.status, items: [], collectedAt, sourceName: SOURCE_NAME, message: outcome.message };
  }

  const record = outcome.parsed as { items?: unknown };
  if (!Array.isArray(record.items)) {
    return { status: "error", items: [], collectedAt, sourceName: SOURCE_NAME, message: "Réponse Claude dans un format inattendu." };
  }

  const maxItems = isGlobal ? MAX_ITEMS_GLOBAL : MAX_ITEMS_PER_PLATFORM;
  const seenUrls = new Set<string>();
  const items: TrendItem[] = [];

  for (const raw of record.items as RawWebTrendItem[]) {
    if (items.length >= maxItems) break;
    const verified = verifyAndNormalizeItem(raw, outcome.verifiedResults);
    if (!verified) continue; // URL non retrouvée dans les résultats réels — jamais affichée.
    if (seenUrls.has(verified.sourceUrl)) continue; // pas deux fois le même article.
    seenUrls.add(verified.sourceUrl);

    const platform = platforms.find((candidate) => candidate === verified.platform) ?? platforms[0];

    items.push({
      id: `anthropic-web-search:${hashId(verified.sourceUrl)}`,
      providerId: "anthropic-web-search",
      category: "web_signal",
      platform,
      title: verified.title,
      description: verified.summary,
      url: verified.sourceUrl,
      publishedAt: verified.publishedAt,
      collectedAt,
      webSearch: {
        sourceCategory: verified.sourceType,
        confidenceLevel: verified.confidenceLevel,
        claimType: verified.claimType,
        searchedAt: collectedAt,
        pageAge: verified.pageAge,
        corroboratingSources: verified.corroboratingSources,
        relevanceJustification: verified.relevanceJustification,
      },
    });
  }

  return { status: "ok", items, collectedAt, sourceName: SOURCE_NAME };
}

async function fetchMusicTrends(params: TrendFetchParams): Promise<ProviderResult<MusicTrendItem>> {
  const collectedAt = new Date().toISOString();
  const platforms = params.platforms && params.platforms.length > 0 ? params.platforms : params.platform ? [params.platform] : [];

  if (platforms.length === 0) {
    return { status: "error", items: [], collectedAt, sourceName: SOURCE_NAME, message: "Aucune plateforme fournie." };
  }

  const outcome = await runWebSearch(
    {
      focus: "music",
      platforms,
      niche: params.niche,
      themeLabels: params.themeLabels ?? [],
      country: params.country,
      language: params.language,
      period: params.period ?? "7d",
    },
    MAX_USES_TARGETED
  );

  if (outcome.status !== "ok") {
    return { status: outcome.status, items: [], collectedAt, sourceName: SOURCE_NAME, message: outcome.message };
  }

  const record = outcome.parsed as { musicItems?: unknown };
  if (!Array.isArray(record.musicItems)) {
    return { status: "error", items: [], collectedAt, sourceName: SOURCE_NAME, message: "Réponse Claude dans un format inattendu." };
  }

  const seenUrls = new Set<string>();
  const items: MusicTrendItem[] = [];

  for (const raw of record.musicItems as RawWebMusicItem[]) {
    if (items.length >= MAX_ITEMS_MUSIC) break;
    const verified = verifyAndNormalizeMusicItem(raw, outcome.verifiedResults);
    if (!verified) continue;
    if (seenUrls.has(verified.sourceUrl)) continue;
    seenUrls.add(verified.sourceUrl);

    const platform = platforms.find((candidate) => candidate === verified.platform) ?? platforms[0];

    items.push({
      id: `anthropic-web-search:${hashId(verified.sourceUrl)}`,
      providerId: "anthropic-web-search",
      platform,
      title: verified.title,
      artist: verified.artist,
      region: verified.region,
      url: verified.sourceUrl,
      sourceName: verified.sourceName,
      observedAt: verified.observedAt,
      note: verified.note,
      collectedAt,
      commercialUseNote: "Vérifiez les droits d'utilisation applicables à votre compte, votre région et votre activité.",
      sourceCategory: verified.sourceType,
      confidenceLevel: verified.confidenceLevel,
    });
  }

  return { status: "ok", items, collectedAt, sourceName: SOURCE_NAME };
}

export const anthropicWebTrendProvider: TrendProvider = {
  id: "anthropic-web-search",
  name: "Veille Web (Claude + recherche Web officielle Anthropic)",
  type: "ai_web_search",
  platforms: ["youtube", "instagram", "facebook", "tiktok", "linkedin", "x", "pinterest", "threads"],
  fetchTrends,
  fetchMusicTrends,
};
