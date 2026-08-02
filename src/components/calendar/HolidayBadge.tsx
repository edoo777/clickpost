import type { HolidayEvent } from "@/types/holiday";

interface HolidayBadgeProps {
  holiday: HolidayEvent;
  onClick?: () => void;
}

/** Apparence volontairement distincte d'une PostChip (publication) — jamais confondue avec une
 * publication, jamais cliquable pour créer une publication automatiquement. */
export function HolidayBadge({ holiday, onClick }: HolidayBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 truncate rounded-md border border-dashed px-1.5 py-0.5 text-left text-[11px] font-medium ${
        holiday.official
          ? "border-emerald-300 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "border-zinc-300 bg-zinc-50/70 text-zinc-600 dark:border-white/[.16] dark:bg-white/[.03] dark:text-zinc-400"
      }`}
      title={holiday.title}
    >
      <span aria-hidden="true">{holiday.official ? "🟢" : "•"}</span>
      <span className="truncate">{holiday.title}</span>
    </button>
  );
}
