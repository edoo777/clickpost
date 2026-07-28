import { DayCell } from "@/components/calendar/DayCell";
import type { Publication } from "@/types/publication";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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
}

export function MonthGrid({ year, month, posts, onSelectPost }: MonthGridProps) {
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

  return (
    <div className="rounded-xl border border-border bg-surface p-4  ">
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day) => (
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
          />
        ))}
      </div>
    </div>
  );
}
