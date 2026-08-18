"use client";

import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { ProviderStateBanner } from "@/components/trends/ProviderStateBanner";
import type { TrendActionContext } from "@/components/trends/TrendActionsMenu";
import { TrendCard } from "@/components/trends/TrendCard";
import type { TrendFilters } from "@/components/trends/TrendsFilterBar";
import { WebSearchNoSignalState } from "@/components/trends/WebSearchNoSignalState";
import { WebSearchTrigger } from "@/components/trends/WebSearchTrigger";
import { usePlatformLabel } from "@/lib/post-status";
import { CACHE_TTL_NEWS_MS } from "@/lib/trends/cache";
import type { PlatformNewsResponse } from "@/lib/trends/client";
import { applyClientFilters, newsItemToDisplayable } from "@/lib/trends/display-mappers";
import { isStale } from "@/lib/trends/freshness";
import type { SocialPlatform } from "@/types/dashboard";

export interface NewsSectionState {
  status: "loading" | "ready";
  result?: PlatformNewsResponse;
}

const TARGET_PLATFORMS: SocialPlatform[] = ["youtube", "instagram", "facebook", "tiktok", "linkedin", "x", "pinterest", "threads"];

export function PlatformNewsSection({
  state,
  filters,
  onRefresh,
  onAdjustFilters,
  context,
  brandName,
  niche,
  themeLabels,
}: {
  state: NewsSectionState;
  filters: TrendFilters;
  onRefresh: () => void;
  onAdjustFilters: (patch: Partial<TrendFilters>) => void;
  context: TrendActionContext;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
}) {
  const platforms = filters.platform === "all" ? TARGET_PLATFORMS : TARGET_PLATFORMS.filter((platform) => platform === filters.platform);
  // undefined = jamais recherché ; [] = recherché, aucun signal fiable ; sinon résultats affichés.
  const [webResultsByPlatform, setWebResultsByPlatform] = useState<Partial<Record<SocialPlatform, DisplayableTrend[]>>>({});
  const PLATFORM_LABEL = usePlatformLabel();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Actualités des plateformes</h2>
          <p className="text-xs text-muted-foreground">
            Annonces officielles (fonctionnalités, algorithmes, monétisation, règles, droits d&apos;auteur, API). Quand
            aucune source officielle n&apos;existe, une veille Web vérifiée peut être lancée manuellement.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={state.status === "loading"}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {state.status === "loading" ? "Actualisation…" : "Actualiser"}
        </button>
      </div>

      {state.status === "loading" && !state.result && <p className="text-xs text-muted-foreground">Chargement…</p>}

      <div className="flex flex-col gap-5">
        {platforms.map((platform) => {
          const platformResult = state.result?.platforms[platform];
          const hasOfficialResults = platformResult?.status === "ok" && platformResult.items.length > 0;
          const webResults = webResultsByPlatform[platform];

          return (
            <div key={platform} className="flex flex-col gap-2">
              <h3 className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {PLATFORM_LABEL[platform]}
                {platformResult?.status === "ok" && isStale(platformResult.cacheAgeMs, CACHE_TTL_NEWS_MS) && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium normal-case text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                    Données périmées — cliquez sur Actualiser
                  </span>
                )}
              </h3>

              {platformResult?.status === "ok" &&
                (() => {
                  const displayed = applyClientFilters(platformResult.items.map(newsItemToDisplayable), { ...filters, platform: "all" });
                  return displayed.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {displayed.map((trend) => (
                        <TrendCard
                          key={trend.id}
                          trend={trend}
                          context={context}
                          brandName={brandName}
                          niche={niche}
                          themeLabels={themeLabels}
                          cacheAgeMs={platformResult.cacheAgeMs}
                        />
                      ))}
                    </div>
                  ) : null;
                })()}

              {!hasOfficialResults && (
                <>
                  {!platformResult ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : platformResult.status === "ok" ? (
                    <p className="text-xs text-muted-foreground">Aucune actualité récente pour cette source officielle.</p>
                  ) : (
                    <ProviderStateBanner status={platformResult.status} message={platformResult.message} />
                  )}

                  {webResults && webResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {webResults.map((trend) => (
                        <TrendCard key={trend.id} trend={trend} context={context} brandName={brandName} niche={niche} themeLabels={themeLabels} />
                      ))}
                    </div>
                  ) : webResults ? (
                    <WebSearchNoSignalState
                      onExpandPeriod={() => onAdjustFilters({ period: "30d" })}
                      onClearNiche={() => onAdjustFilters({ niche: "" })}
                      onExploreAllPlatforms={() => onAdjustFilters({ platform: "all" })}
                    />
                  ) : null}

                  <WebSearchTrigger
                    params={{
                      mode: "targeted",
                      focus: "platform_trends",
                      platform,
                      niche: filters.niche || undefined,
                      themeLabels,
                      country: filters.country,
                      language: filters.language || undefined,
                      period: filters.period === "all" ? "30d" : filters.period,
                    }}
                    onResults={(items) => setWebResultsByPlatform((prev) => ({ ...prev, [platform]: items }))}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
