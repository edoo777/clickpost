"use client";

import Link from "next/link";
import { brandProfiles } from "@/lib/brand-profiles";
import { PLATFORM_LABEL, STATUS_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { PublicationStatus } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

const ALL_STATUSES: PublicationStatus[] = [
  "idea",
  "draft",
  "in_production",
  "in_review",
  "pending_client",
  "approved",
  "scheduled",
  "published",
  "failed",
];

export type ViewMode = "cards" | "table";

export interface PublicationsFiltersValue {
  search: string;
  brand: string | "all";
  platform: SocialPlatform | "all";
  status: PublicationStatus | "all";
  dateFrom: string;
  dateTo: string;
  viewMode: ViewMode;
}

export const DEFAULT_PUBLICATIONS_FILTERS: PublicationsFiltersValue = {
  search: "",
  brand: "all",
  platform: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
  viewMode: "cards",
};

const FIELD_CLASS =
  "rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300";

interface PublicationsFiltersProps {
  value: PublicationsFiltersValue;
  onChange: (value: PublicationsFiltersValue) => void;
}

export function PublicationsFilters({ value, onChange }: PublicationsFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Rechercher une publication…"
          className={`${FIELD_CLASS} w-full sm:w-64`}
        />

        <select
          value={value.brand}
          onChange={(event) => onChange({ ...value, brand: event.target.value })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les marques</option>
          {brandProfiles.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>

        <select
          value={value.platform}
          onChange={(event) =>
            onChange({ ...value, platform: event.target.value as SocialPlatform | "all" })
          }
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
          onChange={(event) =>
            onChange({ ...value, status: event.target.value as PublicationStatus | "all" })
          }
          className={FIELD_CLASS}
        >
          <option value="all">Tous les statuts</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={value.dateFrom}
          onChange={(event) => onChange({ ...value, dateFrom: event.target.value })}
          aria-label="Du"
          className={FIELD_CLASS}
        />
        <input
          type="date"
          value={value.dateTo}
          onChange={(event) => onChange({ ...value, dateTo: event.target.value })}
          aria-label="Au"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-black/[.08] p-1 dark:border-white/[.08]">
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "cards" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "cards"
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Cartes
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "table" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "table"
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Tableau
          </button>
        </div>

        <Link
          href="/publications/new"
          className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          + Nouvelle publication
        </Link>
      </div>
    </div>
  );
}
