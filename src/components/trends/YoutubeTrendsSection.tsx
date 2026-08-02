import { ProviderStateBanner } from "@/components/trends/ProviderStateBanner";
import type { TrendActionContext } from "@/components/trends/TrendActionsMenu";
import { TrendCard } from "@/components/trends/TrendCard";
import type { TrendFilters } from "@/components/trends/TrendsFilterBar";
import { CACHE_TTL_YOUTUBE_MS } from "@/lib/trends/cache";
import type { CachedResult } from "@/lib/trends/client";
import { applyClientFilters, trendItemToDisplayable } from "@/lib/trends/display-mappers";
import { isStale } from "@/lib/trends/freshness";
import type { TrendItem } from "@/types/trend";

export interface YoutubeSectionState {
  status: "loading" | "ready";
  result?: CachedResult<TrendItem>;
}

export function YoutubeTrendsSection({
  state,
  filters,
  onRefresh,
  context,
  brandName,
  niche,
  themeLabels,
}: {
  state: YoutubeSectionState;
  filters: TrendFilters;
  onRefresh: () => void;
  context: TrendActionContext;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
}) {
  const displayed = state.result?.status === "ok" ? applyClientFilters(state.result.items.map(trendItemToDisplayable), filters) : [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tendances YouTube</h2>
          <p className="text-xs text-muted-foreground">Vidéos populaires officielles — YouTube Data API v3 (chart=mostPopular).</p>
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

      {state.result && state.result.status !== "ok" && <ProviderStateBanner status={state.result.status} message={state.result.message} />}

      {state.result?.status === "ok" && (
        <>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {state.result.items.length} vidéo(s) collectée(s)
              {typeof state.result.cacheAgeMs === "number" && state.result.cacheAgeMs > 0 && ` — il y a ${Math.round(state.result.cacheAgeMs / 60_000)} min`}
            </span>
            {isStale(state.result.cacheAgeMs, CACHE_TTL_YOUTUBE_MS) && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                Données périmées — cliquez sur Actualiser
              </span>
            )}
          </p>
          {displayed.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune vidéo ne correspond aux filtres actifs.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {displayed.map((trend) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  context={context}
                  brandName={brandName}
                  niche={niche}
                  themeLabels={themeLabels}
                  cacheAgeMs={state.result?.cacheAgeMs}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
