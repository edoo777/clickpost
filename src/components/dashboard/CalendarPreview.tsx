import { posts } from "@/lib/demo-data";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarPreview() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const cells = buildMonthGrid(year, month);

  const postDays = new Set(
    posts
      .map((post) => new Date(post.scheduledFor))
      .filter((date) => date.getFullYear() === year && date.getMonth() === month)
      .map((date) => date.getDate())
  );

  return (
    <div className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {MONTH_NAMES[month]} {year}
        </h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-600">Aperçu du calendrier</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 dark:text-zinc-600">
        {WEEKDAYS.map((day, i) => (
          <span key={`weekday-${i}`} className="py-1">
            {day}
          </span>
        ))}
        {cells.map((day, i) => {
          const hasPost = day !== null && postDays.has(day);
          const isToday = day === today.getDate();
          return (
            <div
              key={`cell-${i}`}
              className={`flex h-9 items-center justify-center rounded-lg text-sm ${
                day === null
                  ? ""
                  : isToday
                    ? "bg-zinc-950 font-semibold text-white dark:bg-zinc-50 dark:text-black"
                    : hasPost
                      ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {day ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
