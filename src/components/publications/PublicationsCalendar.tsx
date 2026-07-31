"use client";

import { useState, type DragEvent } from "react";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { PostChip } from "@/components/calendar/PostChip";
import type { CalendarMode } from "@/components/publications/view/publications-view-storage";
import { DayView } from "@/components/publications/calendar/DayView";
import { WeekView } from "@/components/publications/calendar/WeekView";
import { usePostsSession } from "@/lib/posts-store";
import type { Publication, PublicationStatus } from "@/types/publication";

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
  "pending_client",
  "approved",
  "ready_to_schedule",
];

interface PublicationsCalendarProps {
  publications: Publication[];
  mode: CalendarMode;
  onChangeMode: (mode: CalendarMode) => void;
  anchor: string;
  onChangeAnchor: (anchor: string) => void;
  onOpen: (id: string) => void;
  onCreateAt: (date: string) => void;
}

export function PublicationsCalendar({
  publications,
  mode,
  onChangeMode,
  anchor,
  onChangeAnchor,
  onOpen,
  onCreateAt,
}: PublicationsCalendarProps) {
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
    const previousTime = post.scheduledFor.slice(11, 16);
    const time = UNSCHEDULED_STATUSES.includes(post.status) ? "09:00" : previousTime || "09:00";
    patchPost(id, { scheduledFor: `${dateKey}T${time}:00` });
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
          />
        )}
      </div>

      <aside className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-3 lg:w-64  ">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ">
          Non planifiées ({unplanned.length})
        </h2>
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
      </aside>
    </div>
  );
}
