import { NextResponse } from "next/server";
import { CACHE_TTL_NEWS_MS, getCached, setCached } from "@/lib/trends/cache";
import { officialFeedProvider } from "@/lib/trends/official-feed-provider";
import { checkTrendsRateLimit } from "@/lib/trends/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlatformNewsItem, ProviderResult } from "@/types/trend";
import type { SocialPlatform } from "@/types/dashboard";

/**
 * Actualités officielles des plateformes — une entrée par plateforme ciblée par le MVP, chacune
 * indépendamment en cache (1–6 h) ou marquée « Aucune source officielle configurée » lorsque
 * aucun flux fiable n'a été identifié (voir official-feed-provider.ts). Jamais d'agrégation qui
 * masquerait une plateforme sans source réelle.
 */

const TARGET_PLATFORMS: SocialPlatform[] = ["youtube", "instagram", "facebook", "tiktok", "linkedin", "x", "pinterest", "threads"];

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
  const forceRefresh = url.searchParams.get("refresh") === "1";

  const platforms: Record<string, ProviderResult<PlatformNewsItem> & { cacheAgeMs: number }> = {};

  await Promise.all(
    TARGET_PLATFORMS.map(async (platform) => {
      const cacheKey = `news:${platform}`;
      if (!forceRefresh) {
        const cached = getCached<ProviderResult<PlatformNewsItem>>(cacheKey);
        if (cached) {
          platforms[platform] = { ...cached.value, cacheAgeMs: cached.ageMs };
          return;
        }
      }
      const result = await officialFeedProvider.fetchNews!({ platform });
      if (result.status === "ok") setCached(cacheKey, result, CACHE_TTL_NEWS_MS);
      platforms[platform] = { ...result, cacheAgeMs: 0 };
    })
  );

  return NextResponse.json({ status: "ok", collectedAt: new Date().toISOString(), platforms });
}
