import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { TrendActionsMenu, type TrendActionContext } from "@/components/trends/TrendActionsMenu";
import { TrendAnalysisTrigger } from "@/components/trends/TrendAnalysisTrigger";
import { formatFreshness } from "@/lib/trends/freshness";

export function TrendCard({
  trend,
  context,
  brandName,
  niche,
  themeLabels,
  cacheAgeMs,
}: {
  trend: DisplayableTrend;
  context: TrendActionContext;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
  cacheAgeMs?: number;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        {trend.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- miniature externe (YouTube), pas dans /public.
          <img src={trend.thumbnailUrl} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{trend.title}</h3>
          {trend.description && <p className="line-clamp-2 text-xs text-muted-foreground">{trend.description}</p>}
          {trend.metaLines.length > 0 && (
            <p className="text-[11px] text-muted-foreground">{trend.metaLines.join(" · ")}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-border px-2 py-0.5 font-medium">{trend.sourceName}</span>
        <span>Collecté {formatFreshness(trend.collectedAt, cacheAgeMs)}</span>
        {trend.publishedAt && <span>· Publié le {new Date(trend.publishedAt).toLocaleDateString("fr-CA")}</span>}
      </div>

      <div className="flex items-start justify-between gap-2">
        <TrendAnalysisTrigger trend={trend} brandName={brandName} niche={niche} themeLabels={themeLabels} />
        <TrendActionsMenu trend={trend} context={context} />
      </div>
    </article>
  );
}
