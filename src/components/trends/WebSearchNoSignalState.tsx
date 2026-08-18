"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Affiché uniquement après une recherche de veille Web explicitement déclenchée qui n'a trouvé
 * aucun résultat suffisamment fiable — jamais avant recherche, jamais inventé pour remplir la
 * section. Les actions ajustent les filtres réels (TrendsView) ou relancent une recherche.
 */
export function WebSearchNoSignalState({
  onExpandPeriod,
  onClearNiche,
  onExploreAllPlatforms,
}: {
  onExpandPeriod: () => void;
  onClearNiche: () => void;
  /** Omis lorsque la section recherche déjà systématiquement toutes les plateformes pertinentes
   * (ex. MusicTrendsSection) — le bouton n'a alors rien de plus à faire. */
  onExploreAllPlatforms?: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{t("trends.noSignalState.message")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onExpandPeriod} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
          {t("trends.noSignalState.expandPeriod")}
        </button>
        <button type="button" onClick={onClearNiche} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
          {t("trends.noSignalState.clearNiche")}
        </button>
        {onExploreAllPlatforms && (
          <button type="button" onClick={onExploreAllPlatforms} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
            {t("trends.noSignalState.exploreAllPlatforms")}
          </button>
        )}
      </div>
    </div>
  );
}
