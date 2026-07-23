import type { EditorialTheme } from "@/types/editorial-calendar";

const INPUT_CLASS =
  "w-full rounded-lg border border-black/[.08] bg-white px-2.5 py-1.5 text-sm text-zinc-800 disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:py-0 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200";

interface ThemeEditorProps {
  theme: EditorialTheme;
  editable: boolean;
  onChange: (theme: EditorialTheme) => void;
  onRemove: () => void;
}

export function ThemeEditor({ theme, editable, onChange, onRemove }: ThemeEditorProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-black/[.06] p-2.5 dark:border-white/[.06]">
      <div className="flex items-center gap-2">
        <input
          disabled={!editable}
          value={theme.label}
          placeholder="Thématique"
          onChange={(event) => onChange({ ...theme, label: event.target.value })}
          className={`${INPUT_CLASS} font-medium`}
        />
        {editable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Supprimer la thématique"
            className="shrink-0 text-xs font-medium text-red-500 hover:underline"
          >
            ✕
          </button>
        )}
      </div>
      <input
        disabled={!editable}
        value={theme.objective}
        placeholder="Objectif de la thématique"
        onChange={(event) => onChange({ ...theme, objective: event.target.value })}
        className={`${INPUT_CLASS} text-xs text-zinc-500 dark:text-zinc-400`}
      />
    </div>
  );
}
