import { platformIcons } from "@/components/icons";
import { FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { ContentIdea } from "@/types/idea-generator";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface IdeaCardProps {
  idea: ContentIdea;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

export function IdeaCard({ idea, isSelected, onToggleSelect, onRegenerate, onDelete }: IdeaCardProps) {
  const Icon = platformIcons[idea.platform];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 shrink-0 rounded border-black/[.2] dark:border-white/[.2]"
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
              {dateFormatter.format(new Date(`${idea.slot.date}T00:00:00`))} · {idea.slot.themeLabel}
            </span>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{idea.subject}</h3>
          </div>
        </label>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        <div>
          <dt className="font-medium text-zinc-400 dark:text-zinc-600">Angle</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{idea.angle}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-400 dark:text-zinc-600">Format</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{FORMAT_LABEL[idea.format]}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-400 dark:text-zinc-600">Objectif</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{idea.objective}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-400 dark:text-zinc-600">Réseau</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{PLATFORM_LABEL[idea.platform]}</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-zinc-400 dark:text-zinc-600">Appel à l&apos;action</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{idea.cta}</dd>
        </div>
      </dl>

      <div className="flex gap-3 border-t border-black/[.06] pt-3 dark:border-white/[.06]">
        <button
          type="button"
          onClick={onRegenerate}
          className="flex-1 rounded-lg border border-black/[.08] px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Régénérer
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 rounded-lg border border-black/[.08] px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-white/[.08] dark:hover:bg-red-500/10"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
