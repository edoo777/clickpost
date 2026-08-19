import { NextResponse } from "next/server";
import { validateWebTrendSearchRequest, type ValidatedWebTrendSearchRequest } from "@/lib/ai/validate-web-trend-search-request";
import { checkAiQuota } from "@/lib/billing/quotas";
import { anthropicWebTrendProvider } from "@/lib/trends/anthropic-web-trend-provider";
import { CACHE_TTL_WEB_MUSIC_MS, CACHE_TTL_WEB_NO_SIGNAL_MS, CACHE_TTL_WEB_TREND_MS, getCached, setCached } from "@/lib/trends/cache";
import {
  consumeSearchQuota,
  getUsageSnapshot,
  peekQuotaStatus,
  recordCacheHit,
  recordProviderError,
  recordSearchUsed,
} from "@/lib/trends/web-search-quota";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MusicTrendItem, ProviderResult, TrendItem } from "@/types/trend";

/**
 * Veille Web intelligente — jamais appelée automatiquement (voir TrendsView/PlatformNewsSection :
 * uniquement sur clic explicite « Rechercher les tendances »/« Rechercher de nouveau »). Ordre de
 * résolution respecté par le client (jamais rappelé ici) : sources officielles → cache → cette
 * route → état honnête sans résultat. Cette route elle-même respecte encore le cache avant de
 * consommer un quota : un clic sur un contexte déjà en cache ne coûte jamais de recherche.
 */

function buildCacheKey(workspaceId: string, input: ValidatedWebTrendSearchRequest): string {
  const platforms = [...input.platforms].sort().join(",");
  return `websearch:${workspaceId}:${input.focus}:${platforms}:${input.niche ?? ""}:${input.country ?? ""}:${input.language ?? ""}:${input.period}`;
}

async function getWorkspaceId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("active_workspace_id").eq("id", userId).single();
  return (data?.active_workspace_id as string | undefined) ?? null;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "error", message: "Authentification requise." }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) return NextResponse.json({ status: "error", message: "Aucun espace de travail actif." }, { status: 400 });

  const url = new URL(request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const validation = validateWebTrendSearchRequest({
    ...rawParams,
    platforms: rawParams.platforms ? rawParams.platforms.split(",") : undefined,
    platform: rawParams.platform,
    themeLabels: rawParams.themeLabels ? rawParams.themeLabels.split("|") : undefined,
  });

  const cacheKey = validation.valid ? buildCacheKey(workspaceId, validation.value) : null;
  const cached = cacheKey ? getCached<ProviderResult<TrendItem> | ProviderResult<MusicTrendItem>>(cacheKey) : null;

  return NextResponse.json({
    status: "ok",
    quota: peekQuotaStatus(workspaceId, user.id),
    usage: getUsageSnapshot(workspaceId),
    cachedAvailable: Boolean(cached),
    cachedAgeMs: cached?.ageMs ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "error", message: "Authentification requise." }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) return NextResponse.json({ status: "error", message: "Aucun espace de travail actif." }, { status: 400 });

  const rawBody = await request.json().catch(() => null);
  const validation = validateWebTrendSearchRequest(rawBody);
  if (!validation.valid) return NextResponse.json({ status: "error", message: validation.message }, { status: 400 });
  const input = validation.value;

  const cacheKey = buildCacheKey(workspaceId, input);
  const forceRefresh = Boolean((rawBody as Record<string, unknown>)?.refresh);

  if (!forceRefresh) {
    const cached = getCached<ProviderResult<TrendItem> | ProviderResult<MusicTrendItem>>(cacheKey);
    if (cached) {
      recordCacheHit(workspaceId);
      return NextResponse.json({
        ...cached.value,
        cacheAgeMs: cached.ageMs,
        quota: peekQuotaStatus(workspaceId, user.id),
      });
    }
  }

  // Quota IA (génération mensuelle Claude) distinct du quota de recherche Web ci-dessous — les
  // jetons/coût réels de cet appel Claude+web_search ne sont pas journalisés dans ai_usage_events
  // (recordAiUsage) : ils ne sont observables qu'à l'intérieur d'anthropic-web-trend-provider.ts,
  // hors périmètre autorisé pour ce chantier. Seul le contrôle a priori est appliqué ici.
  const aiQuota = await checkAiQuota(workspaceId);
  if (!aiQuota.allowed) {
    return NextResponse.json({ status: "error", message: "Quota mensuel de génération IA atteint pour ce workspace." }, { status: 402 });
  }

  const quotaCheck = consumeSearchQuota(input.mode, workspaceId, user.id);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        status: "quota_exceeded",
        message: "Quota de recherche Web atteint pour l'instant.",
        resetAt: quotaCheck.resetAt,
        window: quotaCheck.window,
        quota: peekQuotaStatus(workspaceId, user.id),
      },
      { status: 429 }
    );
  }

  const fetchParams = {
    platform: input.platforms.length === 1 ? input.platforms[0] : undefined,
    platforms: input.platforms.length > 1 ? input.platforms : undefined,
    niche: input.niche,
    themeLabels: input.themeLabels,
    country: input.country,
    language: input.language,
    period: input.period,
  };

  const result =
    input.focus === "music" ? await anthropicWebTrendProvider.fetchMusicTrends!(fetchParams) : await anthropicWebTrendProvider.fetchTrends!(fetchParams);

  recordSearchUsed(workspaceId);
  if (result.status !== "ok") recordProviderError(workspaceId);

  if (result.status === "ok") {
    const ttl = input.focus === "music" ? CACHE_TTL_WEB_MUSIC_MS : result.items.length === 0 ? CACHE_TTL_WEB_NO_SIGNAL_MS : CACHE_TTL_WEB_TREND_MS;
    setCached(cacheKey, result, ttl);
  } else {
    // Un échec (erreur fournisseur, config manquante) reste en cache brièvement pour éviter
    // qu'un clic répété ne consomme le quota en boucle sur une panne déjà connue.
    setCached(cacheKey, result, CACHE_TTL_WEB_NO_SIGNAL_MS);
  }

  return NextResponse.json({ ...result, cacheAgeMs: 0, quota: peekQuotaStatus(workspaceId, user.id) });
}
