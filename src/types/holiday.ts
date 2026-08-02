/** Type de congé tel que classé par la bibliothèque date-holidays — "public" est le seul
 * réellement officiel ; les autres (bank/school/optional/observance) sont informatifs. */
export type HolidayCategory = "public" | "bank" | "school" | "optional" | "observance";

/** Congé calculé par date-holidays — catalogue en lecture seule, jamais stocké dans Supabase
 * ni dans la file de synchronisation (voir src/lib/holidays/holidays-service.ts). */
export interface HolidayEvent {
  id: string;
  type: "holiday";
  title: string;
  /** AAAA-MM-JJ */
  startDate: string;
  /** AAAA-MM-JJ */
  endDate: string;
  allDay: true;
  countryCode: string;
  regionCode?: string;
  category: HolidayCategory;
  /** true uniquement si category === "public". */
  official: boolean;
  source: "date-holidays";
}

export interface HolidayOption {
  code: string;
  name: string;
}
