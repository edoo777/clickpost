import type { DisplayableTrend } from "@/components/trends/displayable-trend";

/**
 * Un seul badge par carte, jamais une accumulation — priorité : signal faible (avertissement le
 * plus important) > source officielle > veille Web vérifiée. « Ne pas surcharger visuellement
 * les cartes ». Aucun badge n'est affiché pour les actualités officielles RSS (déjà annoncées
 * clairement via sourceName sur la carte).
 */
export function SourceBadge({ trend }: { trend: DisplayableTrend }) {
  const isOfficial = trend.provider === "youtube-api" || trend.provider === "official-feed" || trend.sourceCategory === "official";
  const isWebSearch = trend.provider === "anthropic-web-search";
  const isLowConfidence = trend.confidenceLevel === "low";

  if (isWebSearch && isLowConfidence) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
        Signal émergent — à confirmer
      </span>
    );
  }
  if (isOfficial) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
        Source officielle
      </span>
    );
  }
  if (isWebSearch) {
    return (
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-500/10 dark:text-violet-400">
        Veille Web vérifiée
      </span>
    );
  }
  return null;
}
