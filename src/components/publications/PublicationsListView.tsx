"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PublicationCard } from "@/components/publications/PublicationCard";
import { PublicationsCalendar } from "@/components/publications/PublicationsCalendar";
import { PublicationsFilters } from "@/components/publications/PublicationsFilters";
import { PublicationsKanban } from "@/components/publications/PublicationsKanban";
import { PublicationsList } from "@/components/publications/PublicationsList";
import { PublicationsTable } from "@/components/publications/PublicationsTable";
import { PublicationsViewSwitcher } from "@/components/publications/view/PublicationsViewSwitcher";
import { SavedViewsBar } from "@/components/publications/view/SavedViewsBar";
import { filterPublications, sortPublications } from "@/components/publications/view/filter-sort-publications";
import { usePublicationsViewState } from "@/components/publications/view/usePublicationsViewState";
import { usePostsSession } from "@/lib/posts-store";

export function PublicationsListView() {
  const router = useRouter();
  const { posts } = usePostsSession();
  const view = usePublicationsViewState();
  const hasRestoredScroll = useRef(false);

  const filtered = filterPublications(posts, view.filters);
  const sorted = sortPublications(filtered, view.sorting);

  useEffect(() => {
    if (hasRestoredScroll.current) return;
    hasRestoredScroll.current = true;
    if (view.scrollY > 0) {
      requestAnimationFrame(() => window.scrollTo(0, view.scrollY));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpen(id: string) {
    view.saveScrollPosition();
    router.push(`/publications/${id}`);
  }

  function handleCreateAt(date: string) {
    view.saveScrollPosition();
    router.push(`/publications/new?date=${date}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">Publications</h1>
          <p className="text-sm text-muted-foreground ">
            {sorted.length} publication{sorted.length > 1 ? "s" : ""} affichée{sorted.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/publications/new"
          onClick={() => view.saveScrollPosition()}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
        >
          + Nouvelle publication
        </Link>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PublicationsViewSwitcher value={view.viewType} onChange={view.setViewType} />
        <SavedViewsBar
          savedViews={view.savedViews}
          activeSavedViewId={view.savedViewId}
          isModified={view.isModified}
          onSelect={view.selectSavedView}
          onSaveAsNew={view.saveAsNewView}
          onUpdate={view.updateActiveView}
          onRename={view.renameActiveView}
          onDelete={view.deleteActiveView}
          onSetDefault={view.setActiveViewAsDefault}
        />
      </div>

      <PublicationsFilters value={view.filters} onChange={view.setFilters} />

      {sorted.length === 0 && view.viewType !== "calendar" && view.viewType !== "kanban" ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          Aucune publication ne correspond à ces critères.
        </p>
      ) : view.viewType === "table" ? (
        <PublicationsTable
          publications={sorted}
          visibleProperties={view.visibleProperties}
          onChangeVisibleProperties={view.setVisibleProperties}
          columnWidths={view.columnWidths}
          onChangeColumnWidths={view.setColumnWidths}
          sorting={view.sorting}
          onChangeSorting={view.setSorting}
          onOpen={handleOpen}
        />
      ) : view.viewType === "kanban" ? (
        <PublicationsKanban publications={sorted} onOpen={handleOpen} />
      ) : view.viewType === "calendar" ? (
        <PublicationsCalendar
          publications={sorted}
          mode={view.calendarMode}
          onChangeMode={view.setCalendarMode}
          anchor={view.calendarAnchor}
          onChangeAnchor={view.setCalendarAnchor}
          onOpen={handleOpen}
          onCreateAt={handleCreateAt}
        />
      ) : view.viewType === "list" ? (
        <PublicationsList publications={sorted} onOpen={handleOpen} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((post) => (
            <PublicationCard key={post.id} publication={post} onClick={() => view.saveScrollPosition()} />
          ))}
        </div>
      )}
    </div>
  );
}
