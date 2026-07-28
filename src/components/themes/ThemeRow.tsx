import { IconArrowDown, IconArrowUp } from "@/components/icons";
import { WEEKDAYS, WEEKDAY_LABEL } from "@/lib/editorial-constants";
import type { Weekday } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-zinc-800   dark:text-zinc-200";

function dayChipClass(isSelected: boolean): string {
  return `rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
    isSelected
      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
      : "border-border text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
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
          ? "border-border bg-surface  "
          : "border-border bg-zinc-50  dark:bg-zinc-900/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label="Monter la thématique"
            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30  "
          >
            <IconArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label="Descendre la thématique"
            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30  "
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
            className={`${INPUT_CLASS} text-xs text-muted-foreground `}
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
        <span className="text-xs font-medium text-muted-foreground ">
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
        <p className="text-xs text-muted-foreground ">
          Thématique désactivée — masquée des futures attributions, mais conservée dans la bibliothèque.
        </p>
      )}
    </div>
  );
}
