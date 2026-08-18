"use client";

import type { DragEvent } from "react";
import { platformIcons } from "@/components/icons";
import { HolidayBadge } from "@/components/calendar/HolidayBadge";
import { STATUS_STYLE, useStatusLabel } from "@/lib/post-status";
import type { HolidayEvent } from "@/types/holiday";
import type { Publication } from "@/types/publication";

const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

interface DayViewProps {
  date: string;
  posts: Publication[];
  onSelectPost: (post: Publication) => void;
  isDropTarget: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onCreateEmpty: () => void;
  /** Congés — optionnel, fourni uniquement par /calendrier (jamais par Publications). */
  holidays?: HolidayEvent[];
  onSelectHoliday?: (holiday: HolidayEvent) => void;
}

export function DayView({
  date,
  posts,
  onSelectPost,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onCreateEmpty,
  holidays,
  onSelectHoliday,
}: DayViewProps) {
  const STATUS_LABEL = useStatusLabel();
  const dayPosts = posts
    .filter((post) => post.scheduledFor.slice(0, 10) === date)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  const dayHolidays = (holidays ?? []).filter((holiday) => holiday.startDate <= date && date <= holiday.endDate);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col gap-2 rounded-xl border p-4 ${
        isDropTarget ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10" : "border-border bg-surface "
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">
          {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        <button
          type="button"
          onClick={onCreateEmpty}
          className="rounded-lg border border-dashed border-zinc-400 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16] "
        >
          + Créer ce jour
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {dayHolidays.length > 0 && (
          <div className="flex flex-col gap-1">
            {dayHolidays.map((holiday) => (
              <HolidayBadge key={holiday.id} holiday={holiday} onClick={() => onSelectHoliday?.(holiday)} />
            ))}
          </div>
        )}
        {dayPosts.map((post) => {
          const Icon = platformIcons[post.platform];
          return (
            <button
              key={post.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", post.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onSelectPost(post)}
              className="flex cursor-grab items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-zinc-400 active:cursor-grabbing  dark:hover:border-white/[.16]"
            >
              <span className="text-sm font-medium text-muted-foreground ">
                {timeFormatter.format(new Date(post.scheduledFor))}
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ">
                <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </span>
              <span className="flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {post.excerpt || "Sans titre"}
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[post.status]}`}>
                {STATUS_LABEL[post.status]}
              </span>
            </button>
          );
        })}
        {dayPosts.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground  ">
            Aucune publication ce jour.
          </p>
        )}
      </div>
    </div>
  );
}
