import { NextResponse } from "next/server";
import { CACHE_TTL_YOUTUBE_MS, getCached, setCached } from "@/lib/trends/cache";
import { checkTrendsRateLimit } from "@/lib/trends/rate-limit";
import { TREND_REGION_CODES } from "@/lib/trends/regions";
import { youtubeTrendProvider } from "@/lib/trends/youtube-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProviderResult, TrendItem } from "@/types/trend";

/**
 * Tendances YouTube (vidéos populaires officielles, `videos.list?chart=mostPopular`) — jamais
 * appelée directement depuis le navigateur. Cache serveur 30–60 min ; le paramètre `refresh=1`
 * (bouton « Actualiser ») l'ignore explicitement, jamais de rafraîchissement automatique en
 * arrière-plan.
 */

const ALLOWED_REGIONS = new Set(TREND_REGION_CODES);

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "error", message: "Authentification requise." }, { status: 401 });

  const rate = checkTrendsRateLimit(user.id);
  if (!rate.allowed) {
    return NextResponse.json({ status: "error", message: "Trop de demandes — réessayez dans un instant." }, { status: 429 });
  }

  const url = new URL(request.url);
  const regionParam = url.searchParams.get("country")?.toUpperCase();
  const country = regionParam && ALLOWED_REGIONS.has(regionParam) ? regionParam : "CA";
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const cacheKey = `youtube:${country}`;

  if (!forceRefresh) {
    const cached = getCached<ProviderResult<TrendItem>>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached.value, cacheAgeMs: cached.ageMs });
    }
  }

  const result = await youtubeTrendProvider.fetchTrends!({ country });
  if (result.status === "ok") setCached(cacheKey, result, CACHE_TTL_YOUTUBE_MS);

  return NextResponse.json({ ...result, cacheAgeMs: 0 });
}
