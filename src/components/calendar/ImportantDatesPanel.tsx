"use client";

import { useMemo, useState } from "react";
import { IconClose } from "@/components/icons";
import { ALL_IMPORTANT_DATE_CATEGORIES, type ImportantDatesFiltersValue } from "@/components/calendar/calendrier-page-state";
import { useBrandsSession } from "@/lib/brands-store";
import { type ImportantDateDraft, useImportantDatesSession } from "@/lib/important-dates-store";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { ImportantDate, ImportantDateCategory } from "@/types/important-date";

const CATEGORY_LABEL: Record<ImportantDateCategory, string> = {
  holiday: "Congé / jour férié",
  annual_event: "Événement annuel",
  organization: "Événement d'organisation",
  brand_campaign: "Campagne de marque",
};

const CATEGORY_BADGE: Record<ImportantDateCategory, string> = {
  holiday: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  annual_event: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  organization: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  brand_campaign: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
};

const CATEGORY_DOT: Record<ImportantDateCategory, string> = {
  holiday: "bg-emerald-500",
  annual_event: "bg-amber-500",
  organization: "bg-sky-500",
  brand_campaign: "bg-fuchsia-500",
};

const FIELD_CLASS = "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700   dark:text-zinc-300";
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function formatRange(entry: ImportantDate): string {
  const start = dateFormatter.format(new Date(`${entry.startDate}T00:00:00`));
  if (!entry.endDate || entry.endDate === entry.startDate) return start;
  return `${start} → ${dateFormatter.format(new Date(`${entry.endDate}T00:00:00`))}`;
}

function emptyDraft(): ImportantDateDraft {
  return { category: "organization", title: "", description: "", startDate: new Date().toISOString().slice(0, 10) };
}

interface ImportantDatesPanelProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  filters: ImportantDatesFiltersValue;
  onChangeFilters: (value: ImportantDatesFiltersValue) => void;
  onCreatePublicationFromEvent: (entry: ImportantDate) => void;
}

/** Panneau « Dates importantes » — propre à /calendrier, jamais rendu dans la vue Calendrier
 * intégrée de Publications. Réutilise useImportantDatesSession (même moteur de synchronisation
 * que le reste de l'application) et useWorkspaceSession pour les permissions réelles. */
export function ImportantDatesPanel({
  isCollapsed,
  onToggleCollapsed,
  isMobileOpen,
  onCloseMobile,
  filters,
  onChangeFilters,
  onCreatePublicationFromEvent,
}: ImportantDatesPanelProps) {
  const { importantDates, addImportantDate, updateImportantDate, archiveImportantDate, restoreImportantDate } =
    useImportantDatesSession();
  const { brands } = useBrandsSession();
  const { isAdmin: canManage, userId, isLoading: isWorkspaceLoading, workspaceError } = useWorkspaceSession();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportantDateDraft>(emptyDraft());
  const [showArchived, setShowArchived] = useState(false);

  const canEdit = canManage && !isWorkspaceLoading && !workspaceError;

  const countryOptions = useMemo(
    () => Array.from(new Set(importantDates.map((entry) => entry.country).filter((value): value is string => Boolean(value)))),
    [importantDates]
  );
  const regionOptions = useMemo(
    () => Array.from(new Set(importantDates.map((entry) => entry.region).filter((value): value is string => Boolean(value)))),
    [importantDates]
  );

  const visibleEntries = useMemo(() => {
    return importantDates
      .filter((entry) => (showArchived ? entry.status === "archived" : entry.status === "active"))
      .filter((entry) => filters.activeCategories.includes(entry.category))
      .filter((entry) => filters.country === "all" || entry.country === filters.country)
      .filter((entry) => filters.region === "all" || entry.region === filters.region)
      .filter((entry) => filters.brandId === "all" || entry.brandId === filters.brandId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [importantDates, filters, showArchived]);

  function toggleCategory(category: ImportantDateCategory) {
    onChangeFilters({
      ...filters,
      activeCategories: filters.activeCategories.includes(category)
        ? filters.activeCategories.filter((candidate) => candidate !== category)
        : [...filters.activeCategories, category],
    });
  }

  function startCreate() {
    setDraft(emptyDraft());
    setEditingId(null);
    setIsCreating(true);
  }

  function startEdit(entry: ImportantDate) {
    setDraft({
      category: entry.category,
      title: entry.title,
      description: entry.description,
      startDate: entry.startDate,
      endDate: entry.endDate,
      country: entry.country,
      region: entry.region,
      brandId: entry.brandId,
    });
    setEditingId(entry.id);
    setIsCreating(true);
  }

  function handleSubmit() {
    if (!draft.title.trim() || !draft.startDate) return;
    if (editingId) {
      updateImportantDate(editingId, draft);
    } else {
      addImportantDate(draft, userId ?? "");
    }
    setIsCreating(false);
    setEditingId(null);
  }

  const content = (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">Dates importantes</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fermer le panneau"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <IconClose className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Réduire le panneau"
            className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:block"
          >
            «
          </button>
        </div>
      </div>

      {!canManage && !isWorkspaceLoading && !workspaceError && (
        <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-[11px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          Lecture seule — la création et la modification sont réservées aux rôles Propriétaire et Administrateur.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ">Couches</span>
        <div className="flex flex-col gap-1">
          {ALL_IMPORTANT_DATE_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={filters.activeCategories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[category]}`} />
              {CATEGORY_LABEL[category]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Pays
          <select value={filters.country} onChange={(event) => onChangeFilters({ ...filters, country: event.target.value })} className={FIELD_CLASS}>
            <option value="all">Tous</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Région
          <select value={filters.region} onChange={(event) => onChangeFilters({ ...filters, region: event.target.value })} className={FIELD_CLASS}>
            <option value="all">Toutes</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Marque
          <select value={filters.brandId} onChange={(event) => onChangeFilters({ ...filters, brandId: event.target.value })} className={FIELD_CLASS}>
            <option value="all">Toutes</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setShowArchived((prev) => !prev)} className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline ">
          {showArchived ? "Voir les actives" : "Voir les archivées"}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-[11px] font-semibold text-white"
          >
            + Ajouter
          </button>
        )}
      </div>

      {isCreating && canEdit && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3 ">
          <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ImportantDateCategory })} className={FIELD_CLASS}>
            {ALL_IMPORTANT_DATE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABEL[category]}
              </option>
            ))}
          </select>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Titre" className={FIELD_CLASS} />
          <input value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description (optionnel)" className={FIELD_CLASS} />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
              Début
              <input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className={FIELD_CLASS} />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
              Fin (optionnel)
              <input type="date" value={draft.endDate ?? ""} onChange={(event) => setDraft({ ...draft, endDate: event.target.value || undefined })} className={FIELD_CLASS} />
            </label>
          </div>
          {draft.category === "holiday" && (
            <div className="grid grid-cols-2 gap-2">
              <input value={draft.country ?? ""} onChange={(event) => setDraft({ ...draft, country: event.target.value })} placeholder="Pays (ex. CA)" className={FIELD_CLASS} />
              <input value={draft.region ?? ""} onChange={(event) => setDraft({ ...draft, region: event.target.value })} placeholder="Région (optionnel)" className={FIELD_CLASS} />
            </div>
          )}
          {draft.category === "brand_campaign" && (
            <select value={draft.brandId ?? ""} onChange={(event) => setDraft({ ...draft, brandId: event.target.value || undefined })} className={FIELD_CLASS}>
              <option value="">Choisir une marque</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleSubmit} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              {editingId ? "Enregistrer" : "Créer"}
            </button>
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground ">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {visibleEntries.map((entry) => {
          const brandName = entry.brandId ? brands.find((brand) => brand.id === entry.brandId)?.name : undefined;
          return (
            <div key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-2.5 ">
              <div className="flex items-start justify-between gap-2">
                <span className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[entry.category]}`}>
                  {CATEGORY_LABEL[entry.category]}
                </span>
                <span className="text-[11px] text-muted-foreground ">{formatRange(entry)}</span>
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{entry.title}</span>
              {entry.description && <span className="text-[11px] text-muted-foreground ">{entry.description}</span>}
              {brandName && <span className="text-[11px] text-muted-foreground ">Marque : {brandName}</span>}
              <div className="mt-1 flex flex-wrap gap-2">
                <button type="button" onClick={() => onCreatePublicationFromEvent(entry)} className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400">
                  Créer une publication
                </button>
                {canEdit && (
                  <>
                    <button type="button" onClick={() => startEdit(entry)} className="text-[11px] font-medium text-muted-foreground hover:underline ">
                      Modifier
                    </button>
                    {entry.status === "active" ? (
                      <button type="button" onClick={() => archiveImportantDate(entry.id)} className="text-[11px] font-medium text-muted-foreground hover:underline ">
                        Archiver
                      </button>
                    ) : (
                      <button type="button" onClick={() => restoreImportantDate(entry.id)} className="text-[11px] font-medium text-muted-foreground hover:underline ">
                        Restaurer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {visibleEntries.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-[11px] text-muted-foreground dark:border-white/[.12] ">
            {showArchived ? "Aucune date archivée." : "Aucune date pour ces filtres."}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop : colonne réductible */}
      <aside className={`hidden shrink-0 lg:block ${isCollapsed ? "w-12" : "w-72"} transition-[width] duration-200`}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Déployer le panneau Dates importantes"
            className="flex h-full w-full flex-col items-center gap-2 rounded-xl border border-border bg-surface py-4 text-muted-foreground hover:text-foreground "
          >
            »
          </button>
        ) : (
          <div className="h-full rounded-xl border border-border bg-surface p-4 ">{content}</div>
        )}
      </aside>

      {/* Mobile : tiroir */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <button type="button" aria-label="Fermer le panneau" onClick={onCloseMobile} className="absolute inset-0 bg-black/30" />
          <div className="relative flex h-full w-full max-w-sm flex-col bg-surface p-4 shadow-xl">{content}</div>
        </div>
      )}
    </>
  );
}
