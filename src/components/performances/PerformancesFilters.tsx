"use client";

import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePlatformLabel } from "@/lib/post-status";
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
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const PLATFORM_LABEL = usePlatformLabel();
  const accountsForBrand = value.brand === "all" ? accounts : accounts.filter((account) => account.brand === value.brand);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={value.preset}
          onChange={(event) => onChange({ ...value, preset: event.target.value as PeriodPreset })}
          className={FIELD_CLASS}
        >
          <option value="7">{t("performances.filters.last7")}</option>
          <option value="30">{t("performances.filters.last30")}</option>
          <option value="90">{t("performances.filters.last90")}</option>
          <option value="custom">{t("performances.filters.customPeriod")}</option>
        </select>

        {value.preset === "custom" && (
          <>
            <input
              type="date"
              value={value.startDate}
              onChange={(event) => onChange({ ...value, startDate: event.target.value })}
              aria-label={t("performances.filters.startDateLabel")}
              className={FIELD_CLASS}
            />
            <input
              type="date"
              value={value.endDate}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
              aria-label={t("performances.filters.endDateLabel")}
              className={FIELD_CLASS}
            />
          </>
        )}

        <select
          value={value.brand}
          onChange={(event) => onChange({ ...value, brand: event.target.value, accountId: "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">{t("performances.filters.allBrands")}</option>
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
          <option value="all">{t("performances.filters.allAccounts")}</option>
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
          <option value="all">{t("performances.filters.allPlatforms")}</option>
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
        {t("performances.filters.compareToPrevious")}
      </label>
    </div>
  );
}
