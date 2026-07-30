"use client";

import { useMemo, useState } from "react";
import { ConflictComparisonPanel } from "@/components/conflicts/ConflictComparisonPanel";
import { ConflictFilters, DEFAULT_CONFLICT_FILTERS, type ConflictFiltersValue } from "@/components/conflicts/ConflictFilters";
import { ConflictListItem } from "@/components/conflicts/ConflictListItem";
import { useBrandsSession } from "@/lib/brands-store";
import { getConflictBrandRef, getConflictTitle } from "@/lib/conflict-display";
import { useConflictsSession } from "@/lib/conflicts-store";
import type { ConflictEntry } from "@/types/conflict";

export function ConflictCenterView() {
  const { conflicts, isLoading, resolve } = useConflictsSession();
  const { brands } = useBrandsSession();
  const [filters, setFilters] = useState<ConflictFiltersValue>(DEFAULT_CONFLICT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openEntry, setOpenEntry] = useState<ConflictEntry | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const brandById = useMemo(() => new Map(brands.map((brand) => [brand.id, brand.name])), [brands]);

  const filtered = conflicts.filter((entry) => {
    if (filters.entityType !== "all" && entry.entityType !== filters.entityType) return false;
    const { brandId } = getConflictBrandRef(entry.local, entry.remote);
    if (filters.brandId !== "all" && brandId !== filters.brandId) return false;
    if (filters.search.trim()) {
      const title = getConflictTitle(entry.entityType, entry.local, entry.remote).toLowerCase();
      if (!title.includes(filters.search.trim().toLowerCase())) return false;
    }
    const remoteDate = (entry.remote.updatedAt as string | undefined)?.slice(0, 10);
    if (filters.dateFrom && (!remoteDate || remoteDate < filters.dateFrom)) return false;
    if (filters.dateTo && (!remoteDate || remoteDate > filters.dateTo)) return false;
    return true;
  });

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(choice: "keep_local" | "keep_remote") {
    const targets = filtered.filter((entry) => selectedIds.has(entry.id));
    if (targets.length === 0) return;
    const label = choice === "keep_local" ? "la version LOCALE" : "la version DISTANTE";
    const confirmed = window.confirm(
      `Conserver ${label} pour ${targets.length} conflit${targets.length > 1 ? "s" : ""} sélectionné${targets.length > 1 ? "s" : ""} ? Cette action s'applique immédiatement à chacun, sans fusion.`
    );
    if (!confirmed) return;

    setIsBulkRunning(true);
    for (const entry of targets) {
      await resolve(entry, choice);
    }
    setIsBulkRunning(false);
    setSelectedIds(new Set());
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des conflits…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Centre des conflits</h1>
        <p className="text-sm text-muted-foreground">
          {conflicts.length === 0
            ? "Aucun conflit de synchronisation en attente."
            : `${conflicts.length} conflit${conflicts.length > 1 ? "s" : ""} nécessite${conflicts.length > 1 ? "nt" : ""} une action — vos données locales sont conservées, aucune n'a été perdue.`}
        </p>
      </header>

      {conflicts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16]">
          <p className="text-base font-semibold text-foreground">Tout est synchronisé</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Aucun conflit ne nécessite votre attention pour le moment.
          </p>
        </div>
      ) : (
        <>
          <ConflictFilters value={filters} onChange={setFilters} brands={brands} />

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10">
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                disabled={isBulkRunning}
                onClick={() => void runBulk("keep_local")}
                className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/20"
              >
                Conserver local pour la sélection
              </button>
              <button
                type="button"
                disabled={isBulkRunning}
                onClick={() => void runBulk("keep_remote")}
                className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/20"
              >
                Conserver distant pour la sélection
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
              >
                Désélectionner
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12]">
              Aucun conflit ne correspond à ces filtres.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((entry) => {
                const { brandId } = getConflictBrandRef(entry.local, entry.remote);
                return (
                  <ConflictListItem
                    key={`${entry.entityType}-${entry.id}`}
                    entry={entry}
                    brandName={brandId ? brandById.get(brandId) : undefined}
                    isSelected={selectedIds.has(entry.id)}
                    onToggleSelected={() => toggleSelected(entry.id)}
                    onOpen={() => setOpenEntry(entry)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {openEntry && <ConflictComparisonPanel entry={openEntry} onClose={() => setOpenEntry(null)} />}
    </div>
  );
}
