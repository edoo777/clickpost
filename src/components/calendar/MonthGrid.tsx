import type { DragEvent } from "react";
import { DayCell } from "@/components/calendar/DayCell";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { HolidayEvent } from "@/types/holiday";
import type { Publication } from "@/types/publication";

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface MonthGridProps {
  year: number;
  month: number;
  posts: Publication[];
  onSelectPost: (post: Publication) => void;
  /** Glisser-déposer pour replanifier et création par case vide — optionnels, ajoutés pour la
   * vue Calendrier des Publications sans changer le comportement de l'aperçu tableau de bord. */
  draggable?: boolean;
  dropTargetDay?: number | null;
  onDragOverDay?: (event: DragEvent<HTMLDivElement>, day: number) => void;
  onDragLeaveDay?: () => void;
  onDropOnDay?: (event: DragEvent<HTMLDivElement>, day: number) => void;
  onCreateOnDay?: (day: number) => void;
  /** Congés — optionnel, fourni uniquement par /calendrier (jamais par Publications). */
  holidays?: HolidayEvent[];
  onSelectHoliday?: (holiday: HolidayEvent) => void;
}

export function MonthGrid({
  year,
  month,
  posts,
  onSelectPost,
  draggable,
  dropTargetDay,
  onDragOverDay,
  onDragLeaveDay,
  onDropOnDay,
  onCreateOnDay,
  holidays,
  onSelectHoliday,
}: MonthGridProps) {
  const t = useTranslations();
  const weekdaysShort = [
    t("calendar.monthGrid.weekdayShort.monday"),
    t("calendar.monthGrid.weekdayShort.tuesday"),
    t("calendar.monthGrid.weekdayShort.wednesday"),
    t("calendar.monthGrid.weekdayShort.thursday"),
    t("calendar.monthGrid.weekdayShort.friday"),
    t("calendar.monthGrid.weekdayShort.saturday"),
    t("calendar.monthGrid.weekdayShort.sunday"),
  ];
  const cells = buildMonthGrid(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const postsByDay = new Map<number, Publication[]>();
  for (const post of posts) {
    const date = new Date(post.scheduledFor);
    if (date.getFullYear() !== year || date.getMonth() !== month) continue;
    const day = date.getDate();
    const list = postsByDay.get(day) ?? [];
    list.push(post);
    postsByDay.set(day, list);
  }
  for (const list of postsByDay.values()) {
    list.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  const holidaysByDay = new Map<number, HolidayEvent[]>();
  for (const holiday of holidays ?? []) {
    const start = new Date(`${holiday.startDate}T00:00:00`);
    const end = new Date(`${holiday.endDate}T00:00:00`);
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      if (cursor.getFullYear() !== year || cursor.getMonth() !== month) continue;
      const day = cursor.getDate();
      const list = holidaysByDay.get(day) ?? [];
      list.push(holiday);
      holidaysByDay.set(day, list);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4  ">
      <div className="grid grid-cols-7 gap-2">
        {weekdaysShort.map((day) => (
          <div
            key={day}
            className="pb-2 text-center text-xs font-medium text-muted-foreground "
          >
            {day}
          </div>
        ))}
        {cells.map((day, i) => (
          <DayCell
            key={`cell-${i}`}
            day={day}
            isToday={isCurrentMonth && day === today.getDate()}
            posts={day !== null ? (postsByDay.get(day) ?? []) : []}
            onSelectPost={onSelectPost}
            draggable={draggable}
            isDropTarget={day !== null && dropTargetDay === day}
            onDragOver={day !== null ? (event) => onDragOverDay?.(event, day) : undefined}
            onDragLeave={day !== null ? onDragLeaveDay : undefined}
            onDrop={day !== null ? (event) => onDropOnDay?.(event, day) : undefined}
            onCreateEmpty={day !== null ? () => onCreateOnDay?.(day) : undefined}
            holidays={day !== null ? (holidaysByDay.get(day) ?? []) : []}
            onSelectHoliday={onSelectHoliday}
          />
        ))}
      </div>
    </div>
  );
}
