"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { CalendarWorkspace } from "@/components/calendar/CalendarWorkspace";
import {
  getCalendrierPageServerSnapshot,
  getCalendrierPageSnapshot,
  patchCalendrierPage,
  subscribeCalendrierPage,
} from "@/components/calendar/calendrier-page-state";
import { PublicationsFilters } from "@/components/publications/PublicationsFilters";
import { filterPublications } from "@/components/publications/view/filter-sort-publications";
import { usePostsSession } from "@/lib/posts-store";

/**
 * Page dédiée /calendrier — même store et mêmes données que Publications (`usePostsSession`),
 * mais espace d'affichage entièrement séparé : pas de titre « Publications », pas de sélecteur
 * de vues, pas de vues enregistrées. Toute la logique de grille/glisser-déposer/création vient
 * du composant partagé CalendarWorkspace, réutilisé sans duplication.
 */
export function CalendrierPageView() {
  const router = useRouter();
  const { posts } = usePostsSession();
  const state = useSyncExternalStore(subscribeCalendrierPage, getCalendrierPageSnapshot, getCalendrierPageServerSnapshot);
  const hasRestoredScroll = useRef(false);

  const filtered = filterPublications(posts, state.filters);

  useEffect(() => {
    if (hasRestoredScroll.current) return;
    hasRestoredScroll.current = true;
    if (state.scrollY > 0) {
      requestAnimationFrame(() => window.scrollTo(0, state.scrollY));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveScrollPosition() {
    if (typeof window === "undefined") return;
    patchCalendrierPage({ scrollY: window.scrollY });
  }

  function handleOpen(id: string) {
    saveScrollPosition();
    router.push(`/publications/${id}?from=calendrier`);
  }

  function handleCreateAt(date: string) {
    saveScrollPosition();
    router.push(`/publications/new?date=${date}&from=calendrier`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">Calendrier éditorial</h1>
        <p className="text-sm text-muted-foreground ">
          {filtered.length} publication{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
        </p>
      </header>

      <CalendarWorkspace
        publications={filtered}
        mode={state.mode}
        onChangeMode={(mode) => patchCalendrierPage({ mode })}
        anchor={state.anchor}
        onChangeAnchor={(anchor) => patchCalendrierPage({ anchor })}
        onOpen={handleOpen}
        onCreateAt={handleCreateAt}
        showUnplanned={state.showUnplanned}
        onToggleShowUnplanned={() => patchCalendrierPage({ showUnplanned: !state.showUnplanned })}
        filterBar={
          <PublicationsFilters value={state.filters} onChange={(filters) => patchCalendrierPage({ filters })} />
        }
      />
    </div>
  );
}
