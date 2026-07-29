"use client";

import { useBrandsSession } from "@/lib/brands-store";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";

export type PeriodPreset = "7" | "30" | "90" | "custom";

export interface PerformancesFiltersValue {
  preset: PeriodPreset;
  startDate: string;
  endDate: string;
  brand: string | "all";
  accountId: string | "all";
  platform: SocialPlatform | "all";
  compare: boolean;
}

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface PerformancesFiltersProps {
  value: PerformancesFiltersValue;
  accounts: SocialAccount[];
  onChange: (value: PerformancesFiltersValue) => void;
}

export function PerformancesFilters({ value, accounts, onChange }: PerformancesFiltersProps) {
  const { brands } = useBrandsSession();
  const accountsForBrand = value.brand === "all" ? accounts : accounts.filter((account) => account.brand === value.brand);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={value.preset}
          onChange={(event) => onChange({ ...value, preset: event.target.value as PeriodPreset })}
          className={FIELD_CLASS}
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
          <option value="custom">Période personnalisée</option>
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
          value={value.brand}
          onChange={(event) => onChange({ ...value, brand: event.target.value, accountId: "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les marques</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>

        <select
          value={value.accountId}
          onChange={(event) => onChange({ ...value, accountId: event.target.value })}
          className={FIELD_CLASS}
        >
          <option value="all">Tous les comptes</option>
          {accountsForBrand.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountName} ({account.handle})
            </option>
          ))}
        </select>

        <select
          value={value.platform}
          onChange={(event) => onChange({ ...value, platform: event.target.value as SocialPlatform | "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Tous les réseaux</option>
          {ALL_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABEL[platform]}
            </option>
          ))}
        </select>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={value.compare}
          onChange={(event) => onChange({ ...value, compare: event.target.checked })}
          className="h-4 w-4 rounded border-zinc-300 dark:border-white/[.2]"
        />
        Comparer à la période précédente
      </label>
    </div>
  );
}
