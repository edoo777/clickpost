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
  onExploreAllPlatforms: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">Aucun signal récent suffisamment fiable n&apos;a été détecté.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onExpandPeriod} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
          Élargir à 30 jours
        </button>
        <button type="button" onClick={onClearNiche} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
          Retirer le filtre de niche
        </button>
        <button type="button" onClick={onExploreAllPlatforms} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
          Explorer toutes les plateformes
        </button>
      </div>
    </div>
  );
}
