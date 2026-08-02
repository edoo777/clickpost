import type { DragEvent } from "react";
import { HolidayBadge } from "@/components/calendar/HolidayBadge";
import { PostChip } from "@/components/calendar/PostChip";
import type { HolidayEvent } from "@/types/holiday";
import type { Publication } from "@/types/publication";

const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function startOfWeek(anchor: Date): Date {
  const date = new Date(anchor);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface WeekViewProps {
  anchor: Date;
  posts: Publication[];
  onSelectPost: (post: Publication) => void;
  dropTargetDate: string | null;
  onDragOverDay: (event: DragEvent<HTMLDivElement>, date: string) => void;
  onDragLeaveDay: () => void;
  onDropOnDay: (event: DragEvent<HTMLDivElement>, date: string) => void;
  onCreateOnDay: (date: string) => void;
  /** Congés — optionnel, fourni uniquement par /calendrier (jamais par Publications). */
  holidays?: HolidayEvent[];
  onSelectHoliday?: (holiday: HolidayEvent) => void;
}

export function WeekView({
  anchor,
  posts,
  onSelectPost,
  dropTargetDate,
  onDragOverDay,
  onDragLeaveDay,
  onDropOnDay,
  onCreateOnDay,
  holidays,
  onSelectHoliday,
}: WeekViewProps) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
  const today = isoDate(new Date());

  const postsByDate = new Map<string, Publication[]>();
  for (const post of posts) {
    const key = post.scheduledFor.slice(0, 10);
    const list = postsByDate.get(key) ?? [];
    list.push(post);
    postsByDate.set(key, list);
  }
  for (const list of postsByDate.values()) {
    list.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  const holidaysByDate = new Map<string, HolidayEvent[]>();
  for (const holiday of holidays ?? []) {
    const start = new Date(`${holiday.startDate}T00:00:00`);
    const end = new Date(`${holiday.endDate}T00:00:00`);
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const key = isoDate(cursor);
      const list = holidaysByDate.get(key) ?? [];
      list.push(holiday);
      holidaysByDate.set(key, list);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-7  ">
      {days.map((date, index) => {
        const key = isoDate(date);
        const dayPosts = postsByDate.get(key) ?? [];
        const isToday = key === today;
        const isDropTarget = dropTargetDate === key;
        return (
          <div
            key={key}
            onDragOver={(event) => onDragOverDay(event, key)}
            onDragLeave={onDragLeaveDay}
            onDrop={(event) => onDropOnDay(event, key)}
            className={`group flex min-h-[10rem] flex-col gap-2 rounded-lg border p-2 ${
              isDropTarget ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10" : "border-border "
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isToday ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"}`}>
                {WEEKDAY_LABELS[index]} {date.getDate()}
              </span>
              <button
                type="button"
                onClick={() => onCreateOnDay(key)}
                aria-label={`Créer une publication le ${key}`}
                className="hidden h-5 w-5 items-center justify-center rounded-full text-sm font-semibold text-muted-foreground hover:bg-violet-100 hover:text-violet-700 group-hover:flex dark:hover:bg-violet-500/20 dark:hover:text-violet-300"
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {(holidaysByDate.get(key) ?? []).map((holiday) => (
                <HolidayBadge key={holiday.id} holiday={holiday} onClick={() => onSelectHoliday?.(holiday)} />
              ))}
              {dayPosts.map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  onClick={() => onSelectPost(post)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", post.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                />
              ))}
              {dayPosts.length === 0 && <p className="text-xs text-muted-foreground ">Aucune publication</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
