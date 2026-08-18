"use client";

import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { TrendAnalysisTrigger } from "@/components/trends/TrendAnalysisTrigger";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * « Conseils personnalisés » — Claude explique un élément déjà collecté (choisi explicitement
 * dans la liste), jamais une analyse automatique de tout le flux. Réutilise le même déclencheur
 * que TrendCard pour éviter deux implémentations de l'appel /api/ia/tendances/analyze.
 */
export function AdviceSection({
  items,
  brandName,
  niche,
  themeLabels,
}: {
  items: DisplayableTrend[];
  brandName?: string;
  niche?: string;
  themeLabels: string[];
}) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t("trends.advice.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("trends.advice.subtitle")}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("trends.advice.emptyItems")}</p>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full max-w-xl rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">{t("trends.advice.selectPlaceholder")}</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.sourceName}
              </option>
            ))}
          </select>

          {selected && (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-foreground">{selected.title}</p>
              {selected.description && <p className="mt-1 text-xs text-muted-foreground">{selected.description}</p>}
              <div className="mt-3">
                <TrendAnalysisTrigger trend={selected} brandName={brandName} niche={niche} themeLabels={themeLabels} />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
