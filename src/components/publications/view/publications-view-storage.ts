import { DEFAULT_PUBLICATIONS_FILTERS, type PublicationsFiltersValue } from "@/components/publications/PublicationsFilters";
import type { SavedViewSort } from "@/types/saved-view";

export type PublicationsViewType = "table" | "kanban" | "calendar" | "cards" | "list";
export type CalendarMode = "month" | "week" | "day";

export interface PublicationsViewState {
  viewType: PublicationsViewType;
  savedViewId: string | null;
  filters: PublicationsFiltersValue;
  sorting: SavedViewSort[];
  visibleProperties: string[];
  columnWidths: Record<string, number>;
  calendarMode: CalendarMode;
  calendarAnchor: string;
  scrollY: number;
}

export const DEFAULT_TABLE_COLUMNS = [
  "excerpt",
  "text",
  "brand",
  "platform",
  "date",
  "time",
  "status",
  "format",
  "theme",
  "objective",
  "owner",
  "media",
];

const DEFAULT_STATE: PublicationsViewState = {
  viewType: "table",
  savedViewId: null,
  filters: DEFAULT_PUBLICATIONS_FILTERS,
  sorting: [],
  visibleProperties: DEFAULT_TABLE_COLUMNS,
  columnWidths: {},
  calendarMode: "month",
  calendarAnchor: new Date().toISOString().slice(0, 10),
  scrollY: 0,
};

const STORAGE_KEY = "clickpost-publications-view-state";

function readStoredViewState(): PublicationsViewState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublicationsViewState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return null;
  }
}

function writeStoredViewState(state: PublicationsViewState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée stricte, quota) — dégrade silencieusement,
    // la vue reste utilisable, seule la restauration de position/filtres est perdue.
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let currentState: PublicationsViewState = DEFAULT_STATE;
let hydrated = false;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = readStoredViewState();
  if (stored) currentState = stored;
}

/**
 * Magasin externe minimal (sessionStorage + `useSyncExternalStore`) pour l'état d'affichage des
 * Publications — vue active, filtres, tri, colonnes, position du calendrier, position de défilement.
 * Volontairement hors du store synchronisé principal : c'est une préférence d'affichage locale à
 * l'onglet, au même titre que le thème ou l'état de la sidebar, pas une donnée de workspace.
 */
export function subscribePublicationsView(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPublicationsViewSnapshot(): PublicationsViewState {
  ensureHydrated();
  return currentState;
}

export function getPublicationsViewServerSnapshot(): PublicationsViewState {
  return DEFAULT_STATE;
}

export function patchPublicationsView(patch: Partial<PublicationsViewState>) {
  ensureHydrated();
  currentState = { ...currentState, ...patch };
  writeStoredViewState(currentState);
  notifyListeners();
}

export function resetPublicationsView() {
  currentState = DEFAULT_STATE;
  writeStoredViewState(currentState);
  notifyListeners();
}
