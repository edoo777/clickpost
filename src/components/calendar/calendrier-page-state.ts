import type { CalendarMode } from "@/components/calendar/CalendarWorkspace";
import { DEFAULT_PUBLICATIONS_FILTERS, type PublicationsFiltersValue } from "@/components/publications/PublicationsFilters";
import { createSessionStore } from "@/lib/session-storage-store";
import type { ImportantDateCategory } from "@/types/important-date";

export const ALL_IMPORTANT_DATE_CATEGORIES: ImportantDateCategory[] = [
  "holiday",
  "annual_event",
  "organization",
  "brand_campaign",
];

export interface ImportantDatesFiltersValue {
  country: string | "all";
  region: string | "all";
  brandId: string | "all";
  activeCategories: ImportantDateCategory[];
}

export const DEFAULT_IMPORTANT_DATES_FILTERS: ImportantDatesFiltersValue = {
  country: "all",
  region: "all",
  brandId: "all",
  activeCategories: ALL_IMPORTANT_DATE_CATEGORIES,
};

export interface HolidaysLayerState {
  /** null = pays non déterminé — le panneau invite alors l'utilisateur à en choisir un. */
  countryCode: string | null;
  regionCode: string | null;
  year: number;
  locale: string;
  searchQuery: string;
  /** Affichage dans le calendrier — indépendant de la présence dans la liste du panneau. */
  layerEnabled: boolean;
  /** Résolution automatique (profil/marque) déjà tentée une fois cette session — évite de
   * ré-écraser un choix manuel explicite de l'utilisateur à chaque montage. */
  autoResolveAttempted: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_HOLIDAYS_STATE: HolidaysLayerState = {
  countryCode: null,
  regionCode: null,
  year: CURRENT_YEAR,
  locale: "fr",
  searchQuery: "",
  layerEnabled: true,
  autoResolveAttempted: false,
};

export interface CalendrierPageState {
  mode: CalendarMode;
  anchor: string;
  filters: PublicationsFiltersValue;
  showUnplanned: boolean;
  scrollY: number;
  /** Panneau « Dates importantes » — replié sur desktop (persisté, comme la sidebar). */
  isImportantDatesPanelCollapsed: boolean;
  importantDatesFilters: ImportantDatesFiltersValue;
  holidays: HolidaysLayerState;
}

const DEFAULT_STATE: CalendrierPageState = {
  mode: "month",
  anchor: new Date().toISOString().slice(0, 10),
  filters: DEFAULT_PUBLICATIONS_FILTERS,
  showUnplanned: true,
  scrollY: 0,
  isImportantDatesPanelCollapsed: false,
  importantDatesFilters: DEFAULT_IMPORTANT_DATES_FILTERS,
  holidays: DEFAULT_HOLIDAYS_STATE,
};

/** État d'affichage propre à la page dédiée /calendrier — distinct de celui de la vue Calendrier
 * intégrée dans Publications (voir publications-view-storage.ts), pour que les deux emplacements
 * puissent diverger (période, filtres) tout en affichant les mêmes publications. */
const store = createSessionStore("clickpost-calendrier-page-state", DEFAULT_STATE);

export const subscribeCalendrierPage = store.subscribe;
export const getCalendrierPageSnapshot = store.getSnapshot;
export const getCalendrierPageServerSnapshot = store.getServerSnapshot;
export const patchCalendrierPage = store.patch;
