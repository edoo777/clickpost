import type { CalendarMode } from "@/components/calendar/CalendarWorkspace";
import { DEFAULT_PUBLICATIONS_FILTERS, type PublicationsFiltersValue } from "@/components/publications/PublicationsFilters";
import { createSessionStore } from "@/lib/session-storage-store";
import type { SavedViewSort } from "@/types/saved-view";

export type { CalendarMode };
export type PublicationsViewType = "table" | "kanban" | "calendar" | "cards" | "list" | "promotion";

export interface PublicationsViewState {
  viewType: PublicationsViewType;
  savedViewId: string | null;
  filters: PublicationsFiltersValue;
  sorting: SavedViewSort[];
  visibleProperties: string[];
  columnWidths: Record<string, number>;
  calendarMode: CalendarMode;
  calendarAnchor: string;
  showUnplanned: boolean;
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
  showUnplanned: true,
  scrollY: 0,
};

const store = createSessionStore("clickpost-publications-view-state", DEFAULT_STATE);

export const subscribePublicationsView = store.subscribe;
export const getPublicationsViewSnapshot = store.getSnapshot;
export const getPublicationsViewServerSnapshot = store.getServerSnapshot;
export const patchPublicationsView = store.patch;
