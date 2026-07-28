"use client";

import { DevelopMenu } from "@/components/shared/DevelopMenu";
import { IDEA_STATUS_LABEL, IDEA_STATUS_STYLE, PRIORITY_LABEL } from "@/lib/idea-status";
import { useThemesSession } from "@/lib/themes-store";
import type { Idea } from "@/types/idea";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface IdeaBankCardProps {
  idea: Idea;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}

export function IdeaBankCard({ idea, isSelected, onToggleSelect, onOpen }: IdeaBankCardProps) {
  const { themes } = useThemesSession();
  const themeLabel = themes.find((theme) => theme.id === idea.themeId)?.label;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-surface p-4  ${
        isSelected
          ? "border-violet-500 ring-1 ring-violet-500/20 dark:border-violet-400"
          : "border-border hover:border-zinc-400  dark:hover:border-white/[.16]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label="Sélectionner cette idée"
        />
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}>
            {IDEA_STATUS_LABEL[idea.status]}
          </span>
          <DevelopMenu variant="idea" idea={idea} compact />
        </div>
      </div>

      <button type="button" onClick={onOpen} className="flex flex-col gap-1 text-left hover:underline">
        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {idea.title || "Sans titre"}
        </span>
        <span className="truncate text-xs text-muted-foreground ">
          {themeLabel ?? "Sans thématique"} ·{" "}
          {idea.scheduledFor ? dateFormatter.format(new Date(idea.scheduledFor)) : "Sans date"}
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground ">
        {idea.priority && (
          <span className="rounded-full bg-muted px-2 py-0.5 ">
            Priorité {PRIORITY_LABEL[idea.priority].toLowerCase()}
          </span>
        )}
        <span className="rounded-full bg-muted px-2 py-0.5 ">
          {idea.source === "generated" ? "Générée" : "Manuelle"}
        </span>
        {idea.publicationId && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            Transformée
          </span>
        )}
      </div>
    </div>
  );
}
