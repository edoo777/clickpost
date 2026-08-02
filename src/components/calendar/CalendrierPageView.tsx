"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarWorkspace } from "@/components/calendar/CalendarWorkspace";
import { HolidaysSection } from "@/components/calendar/HolidaysSection";
import { ImportantDatesPanel } from "@/components/calendar/ImportantDatesPanel";
import {
  getCalendrierPageServerSnapshot,
  getCalendrierPageSnapshot,
  patchCalendrierPage,
  subscribeCalendrierPage,
} from "@/components/calendar/calendrier-page-state";
import { PublicationsFilters } from "@/components/publications/PublicationsFilters";
import { filterPublications } from "@/components/publications/view/filter-sort-publications";
import { useBrandsSession } from "@/lib/brands-store";
import { resolveDefaultCountryCode } from "@/lib/holidays/resolve-default-region";
import { useHolidayOptions } from "@/lib/holidays/use-holiday-options";
import { useHolidays } from "@/lib/holidays/use-holidays";
import { usePostsSession } from "@/lib/posts-store";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { HolidayEvent } from "@/types/holiday";
import type { ImportantDate } from "@/types/important-date";

/**
 * Page dédiée /calendrier — même store et mêmes données que Publications (`usePostsSession`),
 * mais espace d'affichage entièrement séparé : pas de titre « Publications », pas de sélecteur
 * de vues, pas de vues enregistrées. Toute la logique de grille/glisser-déposer/création vient
 * du composant partagé CalendarWorkspace, réutilisé sans duplication. Le panneau « Dates
 * importantes » est propre à cette page — jamais rendu dans /publications?view=calendar.
 */
export function CalendrierPageView() {
  const router = useRouter();
  const { posts } = usePostsSession();
  const { profile } = useWorkspaceSession();
  const { activeBrand, activeBrandId } = useBrandsSession();
  const state = useSyncExternalStore(subscribeCalendrierPage, getCalendrierPageSnapshot, getCalendrierPageServerSnapshot);
  const hasRestoredScroll = useRef(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayEvent | null>(null);

  const filtered = filterPublications(posts, state.filters);
  const holidaysState = state.holidays;

  const { countries, regions, isLoading: optionsLoading } = useHolidayOptions(holidaysState.countryCode, holidaysState.locale);
  const holidaysResult = useHolidays({
    countryCode: holidaysState.countryCode,
    regionCode: holidaysState.regionCode,
    year: holidaysState.year,
    locale: holidaysState.locale,
    enabled: holidaysState.layerEnabled && Boolean(holidaysState.countryCode),
  });

  useEffect(() => {
    if (hasRestoredScroll.current) return;
    hasRestoredScroll.current = true;
    if (state.scrollY > 0) {
      requestAnimationFrame(() => window.scrollTo(0, state.scrollY));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Résolution automatique du pays par défaut (profil puis marché de la marque active) — une
  // seule fois par session, jamais bloquante, jamais réécrite sur un choix manuel explicite.
  useEffect(() => {
    if (holidaysState.countryCode || holidaysState.autoResolveAttempted || countries.length === 0) return;
    const resolved = resolveDefaultCountryCode(profile?.country, activeBrand?.market, countries);
    patchCalendrierPage({ holidays: { ...holidaysState, countryCode: resolved, autoResolveAttempted: true } });
  }, [holidaysState, countries, profile, activeBrand]);

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

  function handleCreatePublicationFromEvent(entry: ImportantDate) {
    // Ouvre le formulaire de création pré-daté — ne crée jamais la publication automatiquement,
    // l'utilisateur doit toujours l'enregistrer lui-même (voir PublicationView.tsx, inchangé).
    saveScrollPosition();
    router.push(`/publications/new?date=${entry.startDate}&from=calendrier`);
  }

  function handleCreatePublicationFromHoliday(holiday: HolidayEvent) {
    // Même principe : préremplissage date + titre + marque active, jamais d'enregistrement
    // automatique (voir buildBlankPublication dans PublicationView.tsx).
    saveScrollPosition();
    const params = new URLSearchParams({ date: holiday.startDate, title: holiday.title, from: "calendrier" });
    if (activeBrandId) params.set("brandId", activeBrandId);
    router.push(`/publications/new?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">Calendrier éditorial</h1>
          <p className="text-sm text-muted-foreground ">
            {filtered.length} publication{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsMobilePanelOpen(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 lg:hidden  dark:text-zinc-400"
        >
          Dates importantes
        </button>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <CalendarWorkspace
            publications={filtered}
            mode={state.mode}
            onChangeMode={(mode) => patchCalendrierPage({ mode })}
            anchor={state.anchor}
            onChangeAnchor={(anchor) => patchCalendrierPage({ anchor })}
            onOpen={handleOpen}
            onCreateAt={handleCreateAt}
            showUnplanned={false}
            onToggleShowUnplanned={() => {}}
            showUnplannedPanel={false}
            filterBar={
              <PublicationsFilters value={state.filters} onChange={(filters) => patchCalendrierPage({ filters })} />
            }
            holidayEvents={holidaysState.layerEnabled ? holidaysResult.holidays : undefined}
            onSelectHoliday={setSelectedHoliday}
          />
        </div>

        <ImportantDatesPanel
          isCollapsed={state.isImportantDatesPanelCollapsed}
          onToggleCollapsed={() => patchCalendrierPage({ isImportantDatesPanelCollapsed: !state.isImportantDatesPanelCollapsed })}
          isMobileOpen={isMobilePanelOpen}
          onCloseMobile={() => setIsMobilePanelOpen(false)}
          holidaysSlot={
            <HolidaysSection
              value={holidaysState}
              onChange={(patch) => patchCalendrierPage({ holidays: { ...holidaysState, ...patch } })}
              countries={countries}
              regions={regions}
              optionsLoading={optionsLoading}
              holidaysResult={holidaysResult}
              selectedHoliday={selectedHoliday}
              onSelectHoliday={setSelectedHoliday}
              onCreatePublicationFromHoliday={handleCreatePublicationFromHoliday}
            />
          }
          filters={state.importantDatesFilters}
          onChangeFilters={(importantDatesFilters) => patchCalendrierPage({ importantDatesFilters })}
          onCreatePublicationFromEvent={handleCreatePublicationFromEvent}
        />
      </div>
    </div>
  );
}
