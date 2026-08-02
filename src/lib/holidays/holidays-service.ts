import Holidays, { HolidaysTypes } from "date-holidays";
import type { HolidayEvent, HolidayOption } from "@/types/holiday";

/**
 * Service serveur exclusivement local (aucun appel réseau, aucune clé) autour de la
 * bibliothèque date-holidays. Catalogue en lecture seule — jamais persisté dans Supabase
 * ni dans la file de synchronisation (voir docs/limites-connues.md). Toutes les dates
 * proviennent uniquement de la bibliothèque, jamais écrites en dur ici.
 */

const holidaysCache = new Map<string, HolidayEvent[]>();
const countriesCache = new Map<string, HolidayOption[]>();
const regionsCache = new Map<string, HolidayOption[]>();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeHoliday(holiday: HolidaysTypes.Holiday, countryCode: string, regionCode?: string): HolidayEvent {
  const startDate = toIsoDate(holiday.start);
  // `end` est exclusif (minuit du jour suivant pour un congé d'une journée) — on retire jusqu'à
  // 24h pour obtenir la date de fin inclusive réelle, sans jamais descendre avant le début.
  const inclusiveEndMs = Math.max(holiday.start.getTime(), holiday.end.getTime() - 1);
  const endDate = toIsoDate(new Date(inclusiveEndMs));

  return {
    id: `holiday:${countryCode}:${regionCode ?? ""}:${startDate}:${slugify(holiday.name)}`,
    type: "holiday",
    title: holiday.name,
    startDate,
    endDate,
    allDay: true,
    countryCode,
    regionCode,
    category: holiday.type,
    official: holiday.type === "public",
    source: "date-holidays",
  };
}

function cacheKey(countryCode: string, regionCode: string | undefined, year: number, locale: string): string {
  return `${countryCode}|${regionCode ?? ""}|${year}|${locale}`;
}

/** Calcule (et met en cache par pays+région+année+langue) les congés d'une année donnée. */
export function computeHolidays(countryCode: string, regionCode: string | undefined, year: number, locale: string): HolidayEvent[] {
  const key = cacheKey(countryCode, regionCode, year, locale);
  const cached = holidaysCache.get(key);
  if (cached) return cached;

  const instance = regionCode
    ? new Holidays(countryCode, regionCode, { languages: locale })
    : new Holidays(countryCode, { languages: locale });
  const raw = instance.getHolidays(year, locale);
  const events = raw.map((holiday) => normalizeHoliday(holiday, countryCode, regionCode));

  holidaysCache.set(key, events);
  return events;
}

export function getSupportedCountries(locale: string): HolidayOption[] {
  const cached = countriesCache.get(locale);
  if (cached) return cached;
  const instance = new Holidays();
  const entries = Object.entries(instance.getCountries(locale)).map(([code, name]) => ({ code, name }));
  countriesCache.set(locale, entries);
  return entries;
}

export function getSupportedRegions(countryCode: string, locale: string): HolidayOption[] {
  const key = `${countryCode}|${locale}`;
  const cached = regionsCache.get(key);
  if (cached) return cached;
  const instance = new Holidays();
  const entries = Object.entries(instance.getStates(countryCode, locale)).map(([code, name]) => ({ code, name }));
  regionsCache.set(key, entries);
  return entries;
}
