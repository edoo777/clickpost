"use client";

import { useBrandsSession } from "@/lib/brands-store";
import { ACCOUNT_STATUS_LABEL } from "@/lib/account-status";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { AccountStatus, SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_STATUSES: AccountStatus[] = ["connected", "disconnected", "expired", "error", "syncing"];

export interface AccountsFiltersValue {
  brand: string | "all";
  platform: SocialPlatform | "all";
  status: AccountStatus | "all";
}

export const DEFAULT_ACCOUNTS_FILTERS: AccountsFiltersValue = {
  brand: "all",
  platform: "all",
  status: "all",
};

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface AccountsFiltersProps {
  value: AccountsFiltersValue;
  onChange: (value: AccountsFiltersValue) => void;
}

export function AccountsFilters({ value, onChange }: AccountsFiltersProps) {
  const { brands } = useBrandsSession();
  const isDefault = value.brand === "all" && value.platform === "all" && value.status === "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={value.brand}
        onChange={(event) => onChange({ ...value, brand: event.target.value })}
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

      <select
        value={value.status}
        onChange={(event) => onChange({ ...value, status: event.target.value as AccountStatus | "all" })}
        className={FIELD_CLASS}
      >
        <option value="all">Tous les statuts</option>
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ACCOUNT_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_ACCOUNTS_FILTERS)}
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
