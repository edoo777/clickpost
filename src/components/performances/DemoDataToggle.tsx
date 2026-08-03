interface DemoDataToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/** Préférence d'appareil, jamais activée par défaut (voir lib/demo-data-preference.ts) — le
 * seul moyen de faire apparaître des chiffres de démonstration dans /performances. */
export function DemoDataToggle({ enabled, onChange }: DemoDataToggleProps) {
  return (
    <label className="flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground ">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
      Afficher des données de démonstration (aucune vraie statistique)
    </label>
  );
}
