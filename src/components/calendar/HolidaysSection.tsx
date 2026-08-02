"use client";

import { useMemo } from "react";
import type { HolidaysLayerState } from "@/components/calendar/calendrier-page-state";
import type { UseHolidaysResult } from "@/lib/holidays/use-holidays";
import type { HolidayCategory, HolidayEvent, HolidayOption } from "@/types/holiday";

const CATEGORY_LABEL: Record<HolidayCategory, string> = {
  public: "Officiel",
  bank: "Jour bancaire",
  school: "Scolaire",
  optional: "Optionnel",
  observance: "Observance",
};

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700   dark:text-zinc-300";
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function formatRange(holiday: HolidayEvent): string {
  const start = dateFormatter.format(new Date(`${holiday.startDate}T00:00:00`));
  if (holiday.endDate === holiday.startDate) return start;
  return `${start} → ${dateFormatter.format(new Date(`${holiday.endDate}T00:00:00`))}`;
}

interface HolidaysSectionProps {
  value: HolidaysLayerState;
  onChange: (patch: Partial<HolidaysLayerState>) => void;
  countries: HolidayOption[];
  regions: HolidayOption[];
  optionsLoading: boolean;
  holidaysResult: UseHolidaysResult;
  selectedHoliday: HolidayEvent | null;
  onSelectHoliday: (holiday: HolidayEvent | null) => void;
  onCreatePublicationFromHoliday: (holiday: HolidayEvent) => void;
}

/**
 * Congés officiels calculés localement via date-holidays — catalogue en lecture seule, jamais
 * persisté (voir src/lib/holidays/holidays-service.ts). Section distincte des « Dates importantes »
 * créées manuellement par l'utilisateur, rendue dans le même panneau via le slot `holidaysSlot`.
 */
export function HolidaysSection({
  value,
  onChange,
  countries,
  regions,
  optionsLoading,
  holidaysResult,
  selectedHoliday,
  onSelectHoliday,
  onCreatePublicationFromHoliday,
}: HolidaysSectionProps) {
  const { holidays, isLoading, error, retry } = holidaysResult;

  const filtered = useMemo(() => {
    const query = value.searchQuery.trim().toLowerCase();
    const list = query ? holidays.filter((holiday) => holiday.title.toLowerCase().includes(query)) : holidays;
    return [...list].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [holidays, value.searchQuery]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 1 + i);
  }, []);

  return (
    <div className="flex flex-col gap-2.5 border-b border-border pb-4 ">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ">
          Congés officiels
        </span>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground ">
          <input
            type="checkbox"
            checked={value.layerEnabled}
            onChange={(event) => onChange({ layerEnabled: event.target.checked })}
          />
          Afficher dans le calendrier
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Pays
          <select
            value={value.countryCode ?? ""}
            onChange={(event) => onChange({ countryCode: event.target.value || null, regionCode: null })}
            className={FIELD_CLASS}
          >
            <option value="">Choisissez votre pays…</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Région
          <select
            value={value.regionCode ?? ""}
            onChange={(event) => onChange({ regionCode: event.target.value || null })}
            disabled={!value.countryCode || regions.length === 0}
            className={`${FIELD_CLASS} disabled:opacity-50`}
          >
            <option value="">Toutes</option>
            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Année
          <select
            value={value.year}
            onChange={(event) => onChange({ year: Number(event.target.value) })}
            className={FIELD_CLASS}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground ">
          Recherche
          <input
            value={value.searchQuery}
            onChange={(event) => onChange({ searchQuery: event.target.value })}
            placeholder="Nom du congé…"
            className={FIELD_CLASS}
          />
        </label>
      </div>

      {!value.countryCode && (
        <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-[11px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          Choisissez votre pays pour afficher les congés officiels.
        </p>
      )}

      {value.countryCode && optionsLoading && (
        <p className="text-[11px] text-muted-foreground ">Chargement des pays et régions…</p>
      )}

      {value.countryCode && isLoading && <p className="text-[11px] text-muted-foreground ">Chargement des congés…</p>}

      {value.countryCode && !isLoading && error && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-500/30 dark:bg-red-500/10">
          <span className="text-[11px] text-red-700 dark:text-red-400">{error}</span>
          <button type="button" onClick={retry} className="w-fit text-[11px] font-medium text-red-700 underline dark:text-red-400">
            Réessayer
          </button>
        </div>
      )}

      {value.countryCode && !isLoading && !error && (
        <>
          <span className="text-[11px] text-muted-foreground ">
            {filtered.length} congé{filtered.length > 1 ? "s" : ""}
          </span>
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {filtered.map((holiday) => (
              <button
                key={holiday.id}
                type="button"
                onClick={() => onSelectHoliday(holiday)}
                className="flex flex-col gap-0.5 rounded-lg border border-border p-2 text-left hover:border-zinc-400 dark:hover:border-white/[.16]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      holiday.official
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400"
                    }`}
                  >
                    {holiday.official ? "Officiel" : "Informatif"}
                  </span>
                  <span className="text-[11px] text-muted-foreground ">{formatRange(holiday)}</span>
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{holiday.title}</span>
                <span className="text-[11px] text-muted-foreground ">{CATEGORY_LABEL[holiday.category]}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-[11px] text-muted-foreground dark:border-white/[.12] ">
                Aucun congé pour ces filtres.
              </p>
            )}
          </div>
        </>
      )}

      {selectedHoliday && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-violet-300 bg-violet-50/60 p-2.5 dark:border-violet-500/30 dark:bg-violet-500/10">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{selectedHoliday.title}</span>
            <button type="button" onClick={() => onSelectHoliday(null)} className="text-[11px] text-muted-foreground hover:underline ">
              Fermer
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground ">
            {formatRange(selectedHoliday)} · {CATEGORY_LABEL[selectedHoliday.category]}
          </span>
          <button
            type="button"
            onClick={() => onCreatePublicationFromHoliday(selectedHoliday)}
            className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-[11px] font-semibold text-white"
          >
            Créer une publication
          </button>
        </div>
      )}
    </div>
  );
}
