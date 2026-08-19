"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";

interface DemoDataToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/** Préférence d'appareil, jamais activée par défaut (voir lib/demo-data-preference.ts) — le
 * seul moyen de faire apparaître des chiffres de démonstration dans /performances. */
export function DemoDataToggle({ enabled, onChange }: DemoDataToggleProps) {
  const t = useTranslations();
  return (
    <label className="flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground ">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
      {t("performances.demoToggle.label")}
    </label>
  );
}
