"use client";

import { CONFLICT_ENTITY_LABEL } from "@/lib/conflict-display";
import type { SyncEntityType } from "@/lib/sync/types";
import type { Brand } from "@/types/brand";

export interface ConflictFiltersValue {
  search: string;
  entityType: SyncEntityType | "all";
  brandId: string | "all";
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_CONFLICT_FILTERS: ConflictFiltersValue = {
  search: "",
  entityType: "all",
  brandId: "all",
  dateFrom: "",
  dateTo: "",
};

const FIELD_CLASS = "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300";

interface ConflictFiltersProps {
  value: ConflictFiltersValue;
  onChange: (value: ConflictFiltersValue) => void;
  brands: Brand[];
}

/** Filtres du Centre des conflits — le workspace actif est déjà appliqué implicitement en
 * amont (un seul workspace actif à la fois, aucun sélecteur nécessaire ici). Le statut n'a
 * qu'une valeur possible aujourd'hui (« à résoudre » — seuls les conflits non résolus sont
 * listés), le sélecteur reste prêt pour d'éventuels statuts futurs sans changement d'API. */
export function ConflictFilters({ value, onChange, brands }: ConflictFiltersProps) {
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_CONFLICT_FILTERS);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        placeholder="Rechercher un conflit…"
        className={`${FIELD_CLASS} w-full sm:w-64`}
      />

      <select
        value={value.entityType}
        onChange={(event) => onChange({ ...value, entityType: event.target.value as SyncEntityType | "all" })}
        className={FIELD_CLASS}
      >
        <option value="all">Tous les types</option>
        {(Object.entries(CONFLICT_ENTITY_LABEL) as [SyncEntityType, string][]).map(([type, label]) => (
          <option key={type} value={type}>
            {label}
          </option>
        ))}
      </select>

      {brands.length > 0 && (
        <select
          value={value.brandId}
          onChange={(event) => onChange({ ...value, brandId: event.target.value })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les marques</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      )}

      <select value="pending" disabled className={`${FIELD_CLASS} opacity-70`}>
        <option value="pending">À résoudre</option>
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
          onClick={() => onChange(DEFAULT_CONFLICT_FILTERS)}
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
