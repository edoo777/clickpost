"use client";

import { useAccountsSession } from "@/lib/accounts-store";
import { PLATFORM_LABEL, STATUS_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { PublicationStatus } from "@/types/publication";

export interface CalendarFilters {
  brand: string | "all";
  accountId: string | "all";
  platform: SocialPlatform | "all";
  status: PublicationStatus | "all";
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  brand: "all",
  accountId: "all",
  platform: "all",
  status: "all",
};

const PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];
const STATUSES: PublicationStatus[] = [
  "idea",
  "draft",
  "in_production",
  "in_review",
  "pending_client",
  "approved",
  "scheduled",
  "published",
  "failed",
  "rejected",
];

const SELECT_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface FiltersBarProps {
  filters: CalendarFilters;
  onChange: (filters: CalendarFilters) => void;
}

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const { accounts } = useAccountsSession();
  const brands = Array.from(new Set(accounts.map((account) => account.brand)));
  const isDefault =
    filters.brand === "all" &&
    filters.accountId === "all" &&
    filters.platform === "all" &&
    filters.status === "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={SELECT_CLASS}
        value={filters.brand}
        onChange={(event) => onChange({ ...filters, brand: event.target.value })}
      >
        <option value="all">Toutes les marques</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={filters.accountId}
        onChange={(event) => onChange({ ...filters, accountId: event.target.value })}
      >
        <option value="all">Tous les comptes</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.handle}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={filters.platform}
        onChange={(event) =>
          onChange({ ...filters, platform: event.target.value as SocialPlatform | "all" })
        }
      >
        <option value="all">Tous les réseaux</option>
        {PLATFORMS.map((platform) => (
          <option key={platform} value={platform}>
            {PLATFORM_LABEL[platform]}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value as PublicationStatus | "all" })
        }
      >
        <option value="all">Tous les statuts</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CALENDAR_FILTERS)}
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
