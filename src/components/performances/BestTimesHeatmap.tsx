import { Fragment } from "react";
import type { TimeSlotCell } from "@/lib/analytics-report";

const SLOT_ORDER = ["morning", "midday", "afternoon", "evening"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABEL_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function intensityClass(rate: number, maxRate: number): string {
  if (maxRate <= 0 || rate <= 0) return "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600";
  const ratio = rate / maxRate;
  if (ratio > 0.8) return "bg-blue-600 text-white";
  if (ratio > 0.6) return "bg-blue-500 text-white";
  if (ratio > 0.4) return "bg-blue-400 text-white";
  if (ratio > 0.2) return "bg-blue-200 text-blue-900 dark:bg-blue-500/40 dark:text-blue-100";
  return "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200";
}

interface BestTimesHeatmapProps {
  grid: TimeSlotCell[];
  best: TimeSlotCell | null;
}

export function BestTimesHeatmap({ grid, best }: BestTimesHeatmapProps) {
  const maxRate = Math.max(0, ...grid.map((cell) => cell.engagementRate));
  const slotLabels = SLOT_ORDER.map((slotKey) => grid.find((cell) => cell.slotKey === slotKey)?.slotLabel ?? slotKey);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Meilleurs jours et heures</h2>
      {best ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Meilleur créneau :{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {best.weekdayLabel} · {best.slotLabel}
          </span>{" "}
          ({best.engagementRate.toFixed(1)}% d&apos;engagement)
        </p>
      ) : (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Pas assez de données sur cette période.</p>
      )}

      <div className="overflow-x-auto">
        <div className="grid min-w-[420px] grid-cols-[64px_repeat(4,1fr)] gap-1.5">
          <div />
          {slotLabels.map((label) => (
            <div key={label} className="pb-1 text-center text-xs font-medium text-zinc-400 dark:text-zinc-600">
              {label}
            </div>
          ))}

          {WEEKDAY_ORDER.map((weekday) => (
            <Fragment key={weekday}>
              <div className="flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {WEEKDAY_LABEL_SHORT[weekday]}
              </div>
              {SLOT_ORDER.map((slotKey) => {
                const cell = grid.find((candidate) => candidate.weekday === weekday && candidate.slotKey === slotKey);
                const isBest = best !== null && best.weekday === weekday && best.slotKey === slotKey;
                return (
                  <div
                    key={slotKey}
                    title={
                      cell
                        ? `${cell.weekdayLabel} · ${cell.slotLabel} : ${cell.engagementRate.toFixed(1)}% (${cell.count} publication${cell.count > 1 ? "s" : ""})`
                        : undefined
                    }
                    className={`flex h-9 items-center justify-center rounded-md text-[11px] font-medium ${intensityClass(
                      cell?.engagementRate ?? 0,
                      maxRate
                    )} ${isBest ? "ring-2 ring-blue-700 dark:ring-blue-300" : ""}`}
                  >
                    {cell && cell.count > 0 ? `${cell.engagementRate.toFixed(0)}%` : "—"}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
