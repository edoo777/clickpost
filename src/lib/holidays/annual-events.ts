/**
 * Événements culturels/commerciaux récurrents — jamais des congés officiels. Chaque date est
 * soit fixe (documentée comme telle), soit calculée par une règle explicite (n-ième jour de la
 * semaine d'un mois), jamais une valeur inventée. Purement local — aucun appel réseau, aucune
 * donnée persistée : sert uniquement à préremplir le formulaire existant de la couche
 * « Événements annuels » (catégorie "annual_event"), l'utilisateur reste libre de créer, modifier
 * ou ignorer la suggestion.
 */

export interface AnnualEventDefinition {
  key: string;
  label: string;
  /** Précise si la date calculée est une convention nord-américaine largement répandue plutôt
   * qu'une règle universelle (ex. la rentrée scolaire varie selon les régions). */
  approximate?: boolean;
  compute: (year: number) => { startDate: string; endDate?: string };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** N-ième occurrence (1 = première) d'un jour de semaine (0 = dimanche) dans un mois donné. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number): Date {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (occurrence - 1) * 7;
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export const ANNUAL_EVENT_DEFINITIONS: AnnualEventDefinition[] = [
  { key: "valentine", label: "Saint-Valentin", compute: (year) => ({ startDate: isoDate(year, 2, 14) }) },
  { key: "womens_day", label: "Journée internationale des femmes", compute: (year) => ({ startDate: isoDate(year, 3, 8) }) },
  { key: "earth_day", label: "Journée de la Terre", compute: (year) => ({ startDate: isoDate(year, 4, 22) }) },
  {
    key: "mothers_day",
    label: "Fête des Mères",
    approximate: true,
    compute: (year) => ({ startDate: toIso(nthWeekdayOfMonth(year, 5, 0, 2)) }), // 2ᵉ dimanche de mai (convention CA/US)
  },
  {
    key: "fathers_day",
    label: "Fête des Pères",
    approximate: true,
    compute: (year) => ({ startDate: toIso(nthWeekdayOfMonth(year, 6, 0, 3)) }), // 3ᵉ dimanche de juin (convention CA/US)
  },
  { key: "halloween", label: "Halloween", compute: (year) => ({ startDate: isoDate(year, 10, 31) }) },
  {
    key: "black_friday",
    label: "Vendredi fou",
    approximate: true,
    compute: (year) => ({ startDate: toIso(addDays(nthWeekdayOfMonth(year, 11, 4, 4), 1)) }), // lendemain du 4ᵉ jeudi de novembre
  },
  {
    key: "cyber_monday",
    label: "Cyberlundi",
    approximate: true,
    compute: (year) => ({ startDate: toIso(addDays(nthWeekdayOfMonth(year, 11, 4, 4), 4)) }), // 3 jours après le Vendredi fou
  },
  {
    key: "back_to_school",
    label: "Rentrée scolaire",
    approximate: true,
    compute: (year) => ({ startDate: toIso(nthWeekdayOfMonth(year, 9, 1, 1)) }), // 1er lundi de septembre (convention, varie selon les régions)
  },
  {
    key: "holiday_season",
    label: "Période des fêtes",
    compute: (year) => ({ startDate: isoDate(year, 12, 24), endDate: isoDate(year + 1, 1, 2) }),
  },
];
