import type { CalendarMode } from "@/components/calendar/CalendarWorkspace";
import { DEFAULT_PUBLICATIONS_FILTERS, type PublicationsFiltersValue } from "@/components/publications/PublicationsFilters";
import { createSessionStore } from "@/lib/session-storage-store";

export interface CalendrierPageState {
  mode: CalendarMode;
  anchor: string;
  filters: PublicationsFiltersValue;
  showUnplanned: boolean;
  scrollY: number;
}

const DEFAULT_STATE: CalendrierPageState = {
  mode: "month",
  anchor: new Date().toISOString().slice(0, 10),
  filters: DEFAULT_PUBLICATIONS_FILTERS,
  showUnplanned: true,
  scrollY: 0,
};

/** État d'affichage propre à la page dédiée /calendrier — distinct de celui de la vue Calendrier
 * intégrée dans Publications (voir publications-view-storage.ts), pour que les deux emplacements
 * puissent diverger (période, filtres) tout en affichant les mêmes publications. */
const store = createSessionStore("clickpost-calendrier-page-state", DEFAULT_STATE);

export const subscribeCalendrierPage = store.subscribe;
export const getCalendrierPageSnapshot = store.getSnapshot;
export const getCalendrierPageServerSnapshot = store.getServerSnapshot;
export const patchCalendrierPage = store.patch;
