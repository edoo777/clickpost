"use client";

import { PERIOD_PRESET_LABEL, type ReportPeriodPreset } from "@/lib/reports/period-presets";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { ReportType } from "@/types/report";

export interface ReportsFiltersValue {
  brandId: string;
  preset: ReportPeriodPreset;
  startDate: string;
  endDate: string;
  /** Vide = toutes les plateformes. */
  platforms: SocialPlatform[];
  reportType: ReportType;
}

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "threads", "pinterest"];
const PRESETS: ReportPeriodPreset[] = ["this_week", "last_week", "this_month", "last_month", "30d", "quarter", "custom"];
const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "internal", label: "Rapport interne" },
  { value: "client", label: "Rapport client" },
  { value: "executive", label: "Rapport exécutif" },
];

const FIELD_CLASS = "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300";

interface ReportsFiltersProps {
  value: ReportsFiltersValue;
  brands: Brand[];
  onChange: (value: ReportsFiltersValue) => void;
}

export function ReportsFilters({ value, brands, onChange }: ReportsFiltersProps) {
  function togglePlatform(platform: SocialPlatform) {
    const isSelected = value.platforms.includes(platform);
    onChange({
      ...value,
      platforms: isSelected ? value.platforms.filter((p) => p !== platform) : [...value.platforms, platform],
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={value.brandId}
          onChange={(event) => onChange({ ...value, brandId: event.target.value })}
          className={FIELD_CLASS}
          aria-label="Marque"
        >
          {brands.length === 0 && <option value="">Aucune marque</option>}
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <select
          value={value.preset}
          onChange={(event) => onChange({ ...value, preset: event.target.value as ReportPeriodPreset })}
          className={FIELD_CLASS}
          aria-label="Période"
        >
          {PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {PERIOD_PRESET_LABEL[preset]}
            </option>
          ))}
        </select>

        {value.preset === "custom" && (
          <>
            <input
              type="date"
              value={value.startDate}
              onChange={(event) => onChange({ ...value, startDate: event.target.value })}
              aria-label="Du"
              className={FIELD_CLASS}
            />
            <input
              type="date"
              value={value.endDate}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
              aria-label="Au"
              className={FIELD_CLASS}
            />
          </>
        )}

        <select
          value={value.reportType}
          onChange={(event) => onChange({ ...value, reportType: event.target.value as ReportType })}
          className={FIELD_CLASS}
          aria-label="Type de rapport"
        >
          {REPORT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Plateformes">
        <button
          type="button"
          onClick={() => onChange({ ...value, platforms: [] })}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value.platforms.length === 0
              ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              : "border-border text-zinc-600 hover:border-violet-200 hover:bg-violet-50 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
          }`}
        >
          Toutes les plateformes
        </button>
        {ALL_PLATFORMS.map((platform) => {
          const isSelected = value.platforms.includes(platform);
          return (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              aria-pressed={isSelected}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  : "border-border text-zinc-600 hover:border-violet-200 hover:bg-violet-50 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
              }`}
            >
              {PLATFORM_LABEL[platform]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
