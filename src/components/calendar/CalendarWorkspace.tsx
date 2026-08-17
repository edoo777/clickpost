"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { DayView } from "@/components/calendar/DayView";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { PostChip } from "@/components/calendar/PostChip";
import { WeekView } from "@/components/calendar/WeekView";
import { usePostsSession } from "@/lib/posts-store";
import type { HolidayEvent } from "@/types/holiday";
import type { Publication, PublicationStatus } from "@/types/publication";

export type CalendarMode = "month" | "week" | "day";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const UNSCHEDULED_STATUSES: PublicationStatus[] = [
  "idea",
  "to_develop",
  "content_generated",
  "draft",
  "in_production",
  "in_review",
  "needs_changes",
  "pending_client",
  "approved",
  "ready_to_schedule",
];

interface CalendarWorkspaceProps {
  /** Déjà filtrée par l'appelant (marque, réseau, statut, responsable, recherche). */
  publications: Publication[];
  mode: CalendarMode;
  onChangeMode: (mode: CalendarMode) => void;
  anchor: string;
  onChangeAnchor: (anchor: string) => void;
  onOpen: (id: string) => void;
  onCreateAt: (date: string) => void;
  showUnplanned: boolean;
  onToggleShowUnplanned: () => void;
  /** Panneau « Non planifiées » — affiché par défaut (comportement inchangé pour la vue
   * Calendrier intégrée dans Publications). La page dédiée /calendrier le désactive : cette
   * fonctionnalité y est retirée pour laisser toute la largeur au calendrier, mais reste
   * disponible telle quelle dans Publications. */
  showUnplannedPanel?: boolean;
  /** Barre de filtres propre à l'appelant (recherche, marque, réseau, statut, responsable) —
   * rendue au-dessus du calendrier uniquement si fournie. La vue Calendrier intégrée dans
   * Publications ne la fournit pas : elle réutilise la barre de filtres déjà affichée par la
   * coquille Publications, pour ne jamais l'afficher deux fois. */
  filterBar?: ReactNode;
  /** Congés — optionnel, fourni uniquement par la page dédiée /calendrier (jamais par la vue
   * Calendrier intégrée dans Publications, qui ne passe pas ces props). */
  holidayEvents?: HolidayEvent[];
  onSelectHoliday?: (holiday: HolidayEvent) => void;
}

/**
 * Espace calendrier partagé — même store (`usePostsSession`), mêmes données, même moteur de
 * glisser-déposer et de création, utilisé à la fois par la page dédiée `/calendrier` et par la
 * vue Calendrier intégrée dans `/publications?view=calendar`. Chaque appelant possède son propre
 * état d'affichage (mode, période, filtres, publications non planifiées) mais aucune donnée ni
 * logique métier n'est dupliquée.
 */
export function CalendarWorkspace({
  publications,
  mode,
  onChangeMode,
  anchor,
  onChangeAnchor,
  onOpen,
  onCreateAt,
  showUnplanned,
  onToggleShowUnplanned,
  showUnplannedPanel = true,
  filterBar,
  holidayEvents,
  onSelectHoliday,
}: CalendarWorkspaceProps) {
  const { patchPost, changeStatus } = usePostsSession();
  const [dropTargetKey, setDropTargetKey] = useState<string | number | null>(null);
  const anchorDate = new Date(`${anchor}T00:00:00`);
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  const scheduled = publications.filter((post) => !UNSCHEDULED_STATUSES.includes(post.status));
  const unplanned = publications.filter((post) => UNSCHEDULED_STATUSES.includes(post.status));

  function reschedule(id: string, dateKey: string) {
    const post = publications.find((candidate) => candidate.id === id);
    if (!post) return;
    // « Programmée » déclenche une publication LinkedIn réelle et automatique dès l'échéance (voir
    // le planificateur) : seule une publication déjà approuvée peut passer à « Programmée » par un
    // dépôt sur le calendrier — jamais depuis idée/brouillon/en revue/etc. Un dépôt refusé n'a
    // aucun effet (la carte reste dans le panneau « Non planifiées »). Verrouillé aussi côté base
    // de données (voir la migration publications_status_transition_guard).
    if (UNSCHEDULED_STATUSES.includes(post.status) && post.status !== "approved") return;
    const previousTime = post.scheduledFor.slice(11, 16);
    const time = UNSCHEDULED_STATUSES.includes(post.status) ? "09:00" : previousTime || "09:00";
    const nextScheduledFor = `${dateKey}T${time}:00`;
    // Une publication LinkedIn programmée dans le passé est reprise immédiatement par le
    // planificateur réel — jamais un simple rappel ignoré (voir la même règle dans
    // PublicationView.handleSave). Un dépôt sur un jour déjà passé est refusé pour LinkedIn
    // uniquement, avec une explication (contrairement aux refus silencieux ci-dessus, cette
    // erreur n'est pas évidente pour l'utilisateur qui vient de faire le geste).
    if (post.platform === "linkedin" && new Date(nextScheduledFor).getTime() <= Date.now()) {
      window.alert(
        "Cette date est déjà passée — une publication LinkedIn programmée serait publiée immédiatement au prochain passage du planificateur. Choisissez une date future."
      );
      return;
    }
    patchPost(id, { scheduledFor: nextScheduledFor });
    if (UNSCHEDULED_STATUSES.includes(post.status)) {
      changeStatus(id, "scheduled", post.owner || "Calendrier");
    }
  }

  function shiftAnchor(deltaDays: number, unit: "month" | "week" | "day") {
    const next = new Date(anchorDate);
    if (unit === "month") next.setMonth(next.getMonth() + deltaDays);
    else next.setDate(next.getDate() + deltaDays);
    onChangeAnchor(next.toISOString().slice(0, 10));
  }

  function goPrev() {
    if (mode === "month") shiftAnchor(-1, "month");
    else if (mode === "week") shiftAnchor(-7, "week");
    else shiftAnchor(-1, "day");
  }

  function goNext() {
    if (mode === "month") shiftAnchor(1, "month");
    else if (mode === "week") shiftAnchor(7, "week");
    else shiftAnchor(1, "day");
  }

  function goToday() {
    onChangeAnchor(new Date().toISOString().slice(0, 10));
  }

  const label =
    mode === "month"
      ? `${MONTH_NAMES[month]} ${year}`
      : mode === "day"
        ? anchorDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : `Semaine du ${anchor}`;

  return (
    <div className="flex flex-col gap-4">
      {filterBar}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CalendarHeader
              monthLabel={label}
              onPrev={goPrev}
              onNext={goNext}
              onToday={goToday}
              onCreate={() => onCreateAt(anchor)}
            />
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 ">
              {(["month", "week", "day"] as CalendarMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChangeMode(option)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    mode === option
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                      : "text-muted-foreground "
                  }`}
                >
                  {option === "month" ? "Mois" : option === "week" ? "Semaine" : "Jour"}
                </button>
              ))}
            </div>
          </div>

          {holidayEvents && holidayEvents.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground ">
              <span className="flex items-center gap-1">
                <span aria-hidden="true">🟢</span> Congé officiel
              </span>
              <span className="flex items-center gap-1">
                <span aria-hidden="true">•</span> Congé informatif
              </span>
            </div>
          )}

          {mode === "month" && (
            <MonthGrid
              year={year}
              month={month}
              posts={scheduled}
              onSelectPost={(post) => onOpen(post.id)}
              draggable
              dropTargetDay={typeof dropTargetKey === "number" ? dropTargetKey : null}
              onDragOverDay={(event, day) => {
                event.preventDefault();
                setDropTargetKey(day);
              }}
              onDragLeaveDay={() => setDropTargetKey(null)}
              onDropOnDay={(event, day) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                setDropTargetKey(null);
                if (!id) return;
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                reschedule(id, dateKey);
              }}
              onCreateOnDay={(day) => {
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                onCreateAt(dateKey);
              }}
              holidays={holidayEvents}
              onSelectHoliday={onSelectHoliday}
            />
          )}

          {mode === "week" && (
            <WeekView
              anchor={anchorDate}
              posts={scheduled}
              onSelectPost={(post) => onOpen(post.id)}
              dropTargetDate={typeof dropTargetKey === "string" ? dropTargetKey : null}
              onDragOverDay={(event, dateKey) => {
                event.preventDefault();
                setDropTargetKey(dateKey);
              }}
              onDragLeaveDay={() => setDropTargetKey(null)}
              onDropOnDay={(event, dateKey) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                setDropTargetKey(null);
                if (id) reschedule(id, dateKey);
              }}
              onCreateOnDay={(dateKey) => onCreateAt(dateKey)}
              holidays={holidayEvents}
              onSelectHoliday={onSelectHoliday}
            />
          )}

          {mode === "day" && (
            <DayView
              date={anchor}
              posts={scheduled}
              onSelectPost={(post) => onOpen(post.id)}
              isDropTarget={dropTargetKey === anchor}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTargetKey(anchor);
              }}
              onDragLeave={() => setDropTargetKey(null)}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                setDropTargetKey(null);
                if (id) reschedule(id, anchor);
              }}
              onCreateEmpty={() => onCreateAt(anchor)}
              holidays={holidayEvents}
              onSelectHoliday={onSelectHoliday}
            />
          )}
        </div>

        {showUnplannedPanel && (
          <aside className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-3 lg:w-64  ">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ">
                Non planifiées ({unplanned.length})
              </h2>
              <button
                type="button"
                onClick={onToggleShowUnplanned}
                className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {showUnplanned ? "Masquer" : "Afficher"}
              </button>
            </div>
            {showUnplanned && (
              <>
                <p className="text-[11px] text-muted-foreground ">
                  Glissez une publication vers une date pour la planifier.
                </p>
                <div className="flex flex-col gap-1.5">
                  {unplanned.map((post) => (
                    <PostChip
                      key={post.id}
                      post={post}
                      onClick={() => onOpen(post.id)}
                      draggable
                      onDragStart={(event: DragEvent<HTMLButtonElement>) => {
                        event.dataTransfer.setData("text/plain", post.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                    />
                  ))}
                  {unplanned.length === 0 && (
                    <p className="text-xs text-muted-foreground ">Aucune publication non planifiée.</p>
                  )}
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
