interface CalendarHeaderProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
}

export function CalendarHeader({ monthLabel, onPrev, onNext, onToday, onCreate }: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
          Calendrier
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold capitalize tracking-tight text-zinc-950 dark:text-zinc-50">
            {monthLabel}
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Mois précédent"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Mois suivant"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              ›
            </button>
            <button
              type="button"
              onClick={onToday}
              className="ml-2 rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        + Créer une publication
      </button>
    </div>
  );
}
