"use client";

import Link from "next/link";
import { useBrandsSession } from "@/lib/brands-store";
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
  "rejected",
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
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface PublicationsFiltersProps {
  value: PublicationsFiltersValue;
  onChange: (value: PublicationsFiltersValue) => void;
}

export function PublicationsFilters({ value, onChange }: PublicationsFiltersProps) {
  const { brands } = useBrandsSession();
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
          {brands.map((brand) => (
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
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 ">
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "cards" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "cards"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "text-muted-foreground "
            }`}
          >
            Cartes
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "table" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "table"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "text-muted-foreground "
            }`}
          >
            Tableau
          </button>
        </div>

        <Link
          href="/publications/new"
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
        >
          + Nouvelle publication
        </Link>
      </div>
    </div>
  );
}
