"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import type { PublicationsFiltersValue } from "@/components/publications/PublicationsFilters";
import {
  filtersToSavedViewFilters,
  savedViewFiltersToFilters,
} from "@/components/publications/view/filter-sort-publications";
import {
  DEFAULT_TABLE_COLUMNS,
  getPublicationsViewServerSnapshot,
  getPublicationsViewSnapshot,
  patchPublicationsView,
  subscribePublicationsView,
  type CalendarMode,
  type PublicationsViewType,
} from "@/components/publications/view/publications-view-storage";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { getScrollTop } from "@/lib/scroll-container";
import { getCurrentWorkspaceId } from "@/lib/sync/runtime";
import type { SavedView, SavedViewSort, SavedViewType } from "@/types/saved-view";

const VIEW_TYPE_TO_SAVED: Record<PublicationsViewType, SavedViewType> = {
  table: "table",
  kanban: "kanban",
  calendar: "calendar",
  cards: "cards",
  list: "list",
};

function isPublicationsViewType(value: string | null): value is PublicationsViewType {
  return value === "table" || value === "kanban" || value === "calendar" || value === "cards" || value === "list";
}

export function usePublicationsViewState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedViews, addSavedView, updateSavedView, removeSavedView } = useContentWorkspace();
  const state = useSyncExternalStore(
    subscribePublicationsView,
    getPublicationsViewSnapshot,
    getPublicationsViewServerSnapshot
  );

  // Synchronise une seule fois depuis l'URL (lien de la sidebar, redirection /calendrier) —
  // priorité à l'intention explicite du lien sur l'état précédemment restauré.
  useEffect(() => {
    const requested = searchParams.get("view");
    if (isPublicationsViewType(requested) && requested !== state.viewType) {
      patchPublicationsView({ viewType: requested });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSavedView = state.savedViewId ? savedViews.find((view) => view.id === state.savedViewId) : undefined;

  function setViewType(viewType: PublicationsViewType) {
    patchPublicationsView({ viewType });
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewType);
    router.replace(`/publications?${params.toString()}`, { scroll: false });
  }

  function setFilters(filters: PublicationsFiltersValue) {
    patchPublicationsView({ filters });
  }

  function setSorting(sorting: SavedViewSort[]) {
    patchPublicationsView({ sorting });
  }

  function setVisibleProperties(visibleProperties: string[]) {
    patchPublicationsView({ visibleProperties });
  }

  function setColumnWidths(columnWidths: Record<string, number>) {
    patchPublicationsView({ columnWidths });
  }

  function setCalendarMode(calendarMode: CalendarMode) {
    patchPublicationsView({ calendarMode });
  }

  function setCalendarAnchor(calendarAnchor: string) {
    patchPublicationsView({ calendarAnchor });
  }

  function setShowUnplanned(showUnplanned: boolean) {
    patchPublicationsView({ showUnplanned });
  }

  function selectSavedView(id: string | null) {
    if (!id) {
      patchPublicationsView({ savedViewId: null });
      return;
    }
    const view = savedViews.find((candidate) => candidate.id === id);
    if (!view) return;
    patchPublicationsView({
      savedViewId: view.id,
      viewType: (Object.entries(VIEW_TYPE_TO_SAVED).find(([, saved]) => saved === view.viewType)?.[0] ??
        "table") as PublicationsViewType,
      filters: savedViewFiltersToFilters(view.filters),
      sorting: view.sorting,
      visibleProperties: view.visibleProperties.length > 0 ? view.visibleProperties : DEFAULT_TABLE_COLUMNS,
      columnWidths: view.columnWidths ?? {},
    });
  }

  function saveAsNewView(name: string) {
    const now = new Date().toISOString();
    const view: SavedView = {
      id: crypto.randomUUID(),
      workspaceId: getCurrentWorkspaceId() ?? "",
      name,
      viewType: VIEW_TYPE_TO_SAVED[state.viewType],
      filters: filtersToSavedViewFilters(state.filters),
      sorting: state.sorting,
      visibleProperties: state.visibleProperties,
      columnWidths: state.columnWidths,
      hiddenGroups: [],
      isDefault: savedViews.length === 0,
      createdAt: now,
      updatedAt: now,
    };
    addSavedView(view);
    patchPublicationsView({ savedViewId: view.id });
  }

  function updateActiveView() {
    if (!activeSavedView) return;
    updateSavedView(activeSavedView.id, {
      viewType: VIEW_TYPE_TO_SAVED[state.viewType],
      filters: filtersToSavedViewFilters(state.filters),
      sorting: state.sorting,
      visibleProperties: state.visibleProperties,
      columnWidths: state.columnWidths,
      updatedAt: new Date().toISOString(),
    });
  }

  function renameActiveView(name: string) {
    if (!activeSavedView) return;
    updateSavedView(activeSavedView.id, { name, updatedAt: new Date().toISOString() });
  }

  function deleteActiveView() {
    if (!activeSavedView) return;
    removeSavedView(activeSavedView.id);
    patchPublicationsView({ savedViewId: null });
  }

  function setActiveViewAsDefault() {
    if (!activeSavedView) return;
    for (const view of savedViews) {
      if (view.isDefault && view.id !== activeSavedView.id) {
        updateSavedView(view.id, { isDefault: false });
      }
    }
    updateSavedView(activeSavedView.id, { isDefault: true });
  }

  const isModified =
    !!activeSavedView &&
    (JSON.stringify(filtersToSavedViewFilters(state.filters)) !== JSON.stringify(activeSavedView.filters) ||
      JSON.stringify(state.sorting) !== JSON.stringify(activeSavedView.sorting) ||
      JSON.stringify(state.visibleProperties) !== JSON.stringify(activeSavedView.visibleProperties) ||
      JSON.stringify(state.columnWidths) !== JSON.stringify(activeSavedView.columnWidths ?? {}) ||
      VIEW_TYPE_TO_SAVED[state.viewType] !== activeSavedView.viewType);

  function saveScrollPosition() {
    patchPublicationsView({ scrollY: getScrollTop() });
  }

  return {
    ...state,
    savedViews,
    activeSavedView,
    isModified,
    setViewType,
    setFilters,
    setSorting,
    setVisibleProperties,
    setColumnWidths,
    setCalendarMode,
    setCalendarAnchor,
    setShowUnplanned,
    selectSavedView,
    saveAsNewView,
    updateActiveView,
    renameActiveView,
    deleteActiveView,
    setActiveViewAsDefault,
    saveScrollPosition,
  };
}
