"use client";

import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import type { TrendActionContext } from "@/components/trends/TrendActionsMenu";
import { TrendCard } from "@/components/trends/TrendCard";
import { WebSearchNoSignalState } from "@/components/trends/WebSearchNoSignalState";
import { WebSearchTrigger } from "@/components/trends/WebSearchTrigger";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { SocialPlatform } from "@/types/dashboard";

const MUSIC_PLATFORMS: SocialPlatform[] = ["tiktok", "instagram", "youtube", "facebook", "pinterest"];

/**
 * « Musiques et sons » — recherche via veille Web uniquement (aucun fournisseur officiel légal
 * et accessible identifié à l'audit ; Spotify Charts retiré, TikTok Commercial Music Library sans
 * API publique). Jamais de musique fictive, jamais de téléchargement, jamais de parole
 * reproduite, jamais d'affirmation d'usage commercial autorisé sans preuve — appliqué côté prompt
 * (web-trend-search-prompt.ts) ET affiché en permanence ici, quel que soit le résultat.
 */
export function MusicTrendsSection({
  context,
  brandName,
  niche,
  themeLabels,
  country,
  language,
  onAdjustFilters,
}: {
  context: TrendActionContext;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
  country?: string;
  language?: string;
  onAdjustFilters: (patch: { period?: "24h" | "7d" | "30d" | "all"; niche?: string }) => void;
}) {
  const t = useTranslations();
  const [results, setResults] = useState<DisplayableTrend[] | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t("trends.musicSection.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("trends.musicSection.subtitle")}</p>
      </div>

      <WebSearchTrigger
        params={{ mode: "global", focus: "music", platforms: MUSIC_PLATFORMS, niche, themeLabels, country, language, period: "7d" }}
        label={t("trends.musicSection.searchButtonLabel")}
        onResults={setResults}
      />

      {results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {results.map((trend) => (
            <TrendCard key={trend.id} trend={trend} context={context} brandName={brandName} niche={niche} themeLabels={themeLabels} />
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <WebSearchNoSignalState
          onExpandPeriod={() => onAdjustFilters({ period: "30d" })}
          onClearNiche={() => onAdjustFilters({ niche: "" })}
        />
      )}

      {!results && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-foreground">{t("trends.musicSection.noOfficialSource")}</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">{t("trends.musicSection.noOfficialSourceHint")}</p>
        </div>
      )}

      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{t("trends.musicSection.rightsNotice")}</p>
    </section>
  );
}
