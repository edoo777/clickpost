"use client";

import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";
import { usePostsSession } from "@/lib/posts-store";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

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
  const t = useTranslations();
  const { locale } = useLocale();
  const { posts } = usePostsSession();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const cells = buildMonthGrid(year, month);
  const monthLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", { month: "long" }).format(
    new Date(year, month, 1)
  );

  const postDays = new Set(
    posts
      .map((post) => new Date(post.scheduledFor))
      .filter((date) => date.getFullYear() === year && date.getMonth() === month)
      .map((date) => date.getDate())
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize text-foreground ">
          {monthLabel} {year}
        </h2>
        <span className="text-xs text-muted-foreground ">{t("dashboard.calendarPreviewLabel")}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground ">
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
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-white shadow-sm shadow-fuchsia-500/20"
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
