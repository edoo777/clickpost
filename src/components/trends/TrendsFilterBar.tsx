"use client";

import { usePlatformLabel } from "@/lib/post-status";
import { TREND_REGIONS } from "@/lib/trends/regions";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { Theme } from "@/types/theme";

export type TrendPeriod = "24h" | "7d" | "30d" | "all";
export type TrendSourceFilter = "all" | "youtube-api" | "official-feed";

export interface TrendFilters {
  brandId: string | null;
  niche: string;
  market: string;
  themeLabel: string;
  platform: SocialPlatform | "all";
  country: string;
  language: string;
  period: TrendPeriod;
  contentType: string;
  source: TrendSourceFilter;
}

const PERIOD_LABEL: Record<TrendPeriod, string> = {
  "24h": "24 dernières heures",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  all: "Toute période",
};

const PLATFORM_OPTIONS: SocialPlatform[] = ["youtube", "instagram", "facebook", "tiktok", "linkedin", "x", "pinterest", "threads"];

/** Préremplit les filtres à partir de la marque active — l'utilisateur peut ensuite tout
 * élargir manuellement (voir handleReset dans TrendsView). Jamais de niche/plateforme devinée
 * quand aucune marque n'est active. */
export function buildDefaultFilters(activeBrand: Brand | null, brandThemes: Theme[]): TrendFilters {
  return {
    brandId: activeBrand?.id ?? null,
    niche: activeBrand?.industry ?? "",
    market: activeBrand?.market ?? "",
    themeLabel: brandThemes[0]?.label ?? "",
    platform: activeBrand?.socialPlatforms?.[0] ?? "all",
    country: "CA",
    language: activeBrand?.languages?.[0] ?? "fr",
    period: "7d",
    contentType: "",
    source: "all",
  };
}

const selectClass =
  "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

export function TrendsFilterBar({
  filters,
  onChange,
  activeBrand,
  brandThemes,
}: {
  filters: TrendFilters;
  onChange: (next: TrendFilters) => void;
  activeBrand: Brand | null;
  brandThemes: Theme[];
}) {
  const PLATFORM_LABEL = usePlatformLabel();
  function patch(partial: Partial<TrendFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-niche">Niche</label>
          <input
            id="trend-niche"
            value={filters.niche}
            onChange={(event) => patch({ niche: event.target.value })}
            placeholder="Ex. Fitness"
            className={`${selectClass} w-40`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-theme">Thématique</label>
          {brandThemes.length > 0 ? (
            <select
              id="trend-theme"
              value={filters.themeLabel}
              onChange={(event) => patch({ themeLabel: event.target.value })}
              className={`${selectClass} w-40`}
            >
              <option value="">Toutes</option>
              {brandThemes.map((theme) => (
                <option key={theme.id} value={theme.label}>{theme.label}</option>
              ))}
            </select>
          ) : (
            <input
              id="trend-theme"
              value={filters.themeLabel}
              onChange={(event) => patch({ themeLabel: event.target.value })}
              placeholder="Libre"
              className={`${selectClass} w-40`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-platform">Plateforme</label>
          <select
            id="trend-platform"
            value={filters.platform}
            onChange={(event) => patch({ platform: event.target.value as SocialPlatform | "all" })}
            className={`${selectClass} w-36`}
          >
            <option value="all">Toutes</option>
            {PLATFORM_OPTIONS.map((platform) => (
              <option key={platform} value={platform}>{PLATFORM_LABEL[platform]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-country">Pays</label>
          <select
            id="trend-country"
            value={filters.country}
            onChange={(event) => patch({ country: event.target.value })}
            className={`${selectClass} w-36`}
          >
            {TREND_REGIONS.map((region) => (
              <option key={region.code} value={region.code}>{region.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-language">Langue</label>
          <input
            id="trend-language"
            value={filters.language}
            onChange={(event) => patch({ language: event.target.value })}
            placeholder="fr"
            className={`${selectClass} w-20`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-period">Période</label>
          <select
            id="trend-period"
            value={filters.period}
            onChange={(event) => patch({ period: event.target.value as TrendPeriod })}
            className={`${selectClass} w-40`}
          >
            {(Object.keys(PERIOD_LABEL) as TrendPeriod[]).map((period) => (
              <option key={period} value={period}>{PERIOD_LABEL[period]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-content-type">Type de contenu</label>
          <input
            id="trend-content-type"
            value={filters.contentType}
            onChange={(event) => patch({ contentType: event.target.value })}
            placeholder="Libre"
            className={`${selectClass} w-32`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="trend-source">Source</label>
          <select
            id="trend-source"
            value={filters.source}
            onChange={(event) => patch({ source: event.target.value as TrendSourceFilter })}
            className={`${selectClass} w-44`}
          >
            <option value="all">Toutes les sources</option>
            <option value="youtube-api">YouTube Data API v3</option>
            <option value="official-feed">Flux officiels des plateformes</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => onChange(buildDefaultFilters(activeBrand, brandThemes))}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Réinitialiser à la marque active
        </button>
      </div>

      {!activeBrand && (
        <p className="text-xs text-muted-foreground">
          Aucune marque active — les filtres restent vides jusqu&apos;à ce que vous les renseigniez manuellement.
        </p>
      )}
    </div>
  );
}
