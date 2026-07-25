import { IconArrowDown, IconArrowUp } from "@/components/icons";
import { WEEKDAYS, WEEKDAY_LABEL } from "@/lib/editorial-constants";
import type { Weekday } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

const INPUT_CLASS =
  "w-full rounded-lg border border-black/[.08] bg-white px-2.5 py-1.5 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200";

function dayChipClass(isSelected: boolean): string {
  return `rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
    isSelected
      ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black"
      : "border-black/[.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
  }`;
}

interface ThemeRowProps {
  theme: Theme;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (patch: Partial<Theme>) => void;
  onToggleActive: () => void;
  onToggleWeekday: (day: Weekday) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function ThemeRow({
  theme,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onToggleActive,
  onToggleWeekday,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ThemeRowProps) {
  function handleRemove() {
    if (window.confirm(`Supprimer définitivement la thématique « ${theme.label || "sans titre"} » ?`)) {
      onRemove();
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        theme.active
          ? "border-black/[.08] bg-white dark:border-white/[.08] dark:bg-zinc-950"
          : "border-black/[.06] bg-zinc-50 dark:border-white/[.06] dark:bg-zinc-900/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label="Monter la thématique"
            className="rounded-md border border-black/[.08] p-1 text-zinc-500 disabled:opacity-30 dark:border-white/[.08] dark:text-zinc-400"
          >
            <IconArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label="Descendre la thématique"
            className="rounded-md border border-black/[.08] p-1 text-zinc-500 disabled:opacity-30 dark:border-white/[.08] dark:text-zinc-400"
          >
            <IconArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <input
            value={theme.label}
            placeholder="Nom de la thématique"
            onChange={(event) => onUpdate({ label: event.target.value })}
            className={`${INPUT_CLASS} font-medium`}
          />
          <input
            value={theme.objective}
            placeholder="Objectif de la thématique"
            onChange={(event) => onUpdate({ objective: event.target.value })}
            className={`${INPUT_CLASS} text-xs text-zinc-500 dark:text-zinc-400`}
          />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={onToggleActive}
            aria-label={theme.active ? "Désactiver la thématique" : "Réactiver la thématique"}
            className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
              theme.active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                theme.active ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-red-500 hover:underline"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Jours de la semaine
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onToggleWeekday(day)}
              className={dayChipClass(theme.weekdays.includes(day))}
            >
              {WEEKDAY_LABEL[day]}
            </button>
          ))}
        </div>
      </div>

      {!theme.active && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Thématique désactivée — masquée des futures attributions, mais conservée dans la bibliothèque.
        </p>
      )}
    </div>
  );
}
