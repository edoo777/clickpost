"use client";

import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { SourceBadge } from "@/components/trends/SourceBadge";
import { TrendActionsMenu, type TrendActionContext } from "@/components/trends/TrendActionsMenu";
import { TrendAnalysisTrigger } from "@/components/trends/TrendAnalysisTrigger";
import { useTranslations } from "@/lib/i18n/locale-provider";
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
  const t = useTranslations();
  const [showWhy, setShowWhy] = useState(false);
  const corroboratingCount = trend.corroboratingSources?.length ?? 0;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        {trend.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- miniature externe (YouTube), pas dans /public.
          <img src={trend.thumbnailUrl} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-foreground">{trend.title}</h3>
            <SourceBadge trend={trend} />
          </div>
          {trend.description && <p className="line-clamp-2 text-xs text-muted-foreground">{trend.description}</p>}
          {trend.metaLines.length > 0 && (
            <p className="text-[11px] text-muted-foreground">{trend.metaLines.join(" · ")}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-border px-2 py-0.5 font-medium">{trend.sourceName}</span>
        <span>{t("trends.card.collectedPrefix", { freshness: formatFreshness(trend.collectedAt, cacheAgeMs) })}</span>
        {trend.publishedAt && (
          <span>{t("trends.card.publishedPrefix", { date: new Date(trend.publishedAt).toLocaleDateString("fr-CA") })}</span>
        )}
        {trend.searchedAt && <span>{t("trends.card.searchedPrefix", { freshness: formatFreshness(trend.searchedAt) })}</span>}
        {corroboratingCount > 0 && (
          <span>{t("trends.card.corroboratingSources", { count: corroboratingCount, plural: corroboratingCount > 1 ? "s" : "" })}</span>
        )}
      </div>

      {trend.relevanceJustification && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowWhy((prev) => !prev)}
            className="w-fit text-[11px] font-medium text-violet-700 hover:underline dark:text-violet-300"
          >
            {showWhy ? t("trends.card.hideJustification") : t("trends.card.whyRelevant")}
          </button>
          {showWhy && (
            <p className="rounded-lg bg-violet-50/60 px-3 py-2 text-xs text-foreground dark:bg-violet-500/[.06]">
              {trend.relevanceJustification}
            </p>
          )}
        </div>
      )}

      {corroboratingCount > 0 && (
        <ul className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          {trend.corroboratingSources!.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {source.title || source.url}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start justify-between gap-2">
        <TrendAnalysisTrigger trend={trend} brandName={brandName} niche={niche} themeLabels={themeLabels} />
        <TrendActionsMenu trend={trend} context={context} />
      </div>
    </article>
  );
}
