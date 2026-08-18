import { useTranslations } from "@/lib/i18n/locale-provider";

interface CalendarHeaderProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
}

export function CalendarHeader({ monthLabel, onPrev, onNext, onToday, onCreate }: CalendarHeaderProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground ">
          {t("calendar.header.eyebrow")}
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold capitalize tracking-tight text-foreground ">
            {monthLabel}
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              aria-label={t("calendar.header.prevMonth")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label={t("calendar.header.nextMonth")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              ›
            </button>
            <button
              type="button"
              onClick={onToday}
              className="ml-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {t("calendar.header.today")}
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
      >
        + {t("calendar.header.createPublication")}
      </button>
    </div>
  );
}
