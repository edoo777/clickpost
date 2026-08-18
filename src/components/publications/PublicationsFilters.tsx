"use client";

import { useBrandsSession } from "@/lib/brands-store";
import { useStatusLabel, usePlatformLabel } from "@/lib/post-status";
import { useTeamSession } from "@/lib/team-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { PublicationStatus } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

const ALL_STATUSES: PublicationStatus[] = [
  "idea",
  "draft",
  "in_production",
  "in_review",
  "needs_changes",
  "pending_client",
  "approved",
  "scheduled",
  "published",
  "failed",
  "rejected",
  "archived",
];

export interface PublicationsFiltersValue {
  search: string;
  brand: string | "all";
  platform: SocialPlatform | "all";
  status: PublicationStatus | "all";
  owner: string | "all";
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_PUBLICATIONS_FILTERS: PublicationsFiltersValue = {
  search: "",
  brand: "all",
  platform: "all",
  status: "all",
  owner: "all",
  dateFrom: "",
  dateTo: "",
};

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface PublicationsFiltersProps {
  value: PublicationsFiltersValue;
  onChange: (value: PublicationsFiltersValue) => void;
}

export function PublicationsFilters({ value, onChange }: PublicationsFiltersProps) {
  const { brands } = useBrandsSession();
  const { members } = useTeamSession();
  const PLATFORM_LABEL = usePlatformLabel();
  const STATUS_LABEL = useStatusLabel();
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_PUBLICATIONS_FILTERS);

  return (
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
        onChange={(event) => onChange({ ...value, status: event.target.value as PublicationStatus | "all" })}
        className={FIELD_CLASS}
      >
        <option value="all">Tous les statuts</option>
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        value={value.owner}
        onChange={(event) => onChange({ ...value, owner: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">Tous les responsables</option>
        {members.map((member) => (
          <option key={member.id} value={member.name}>
            {member.name}
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

      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PUBLICATIONS_FILTERS)}
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
