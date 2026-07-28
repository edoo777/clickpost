"use client";

import type { DragEvent } from "react";
import { PRIORITY_LABEL } from "@/lib/idea-status";
import { useThemesSession } from "@/lib/themes-store";
import type { Idea } from "@/types/idea";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

interface KanbanCardProps {
  idea: Idea;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}

export function KanbanCard({ idea, isSelected, onToggleSelect, onOpen }: KanbanCardProps) {
  const { themes } = useThemesSession();
  const themeLabel = themes.find((theme) => theme.id === idea.themeId)?.label;

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", idea.id);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex cursor-grab flex-col gap-2 rounded-lg border bg-surface p-3 active:cursor-grabbing  ${
        isSelected
          ? "border-violet-500 ring-1 ring-violet-500/20 dark:border-violet-400"
          : "border-border hover:border-zinc-400  dark:hover:border-white/[.16]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label="Sélectionner cette idée"
        />
        {idea.priority && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground  ">
            {PRIORITY_LABEL[idea.priority]}
          </span>
        )}
      </div>

      <button type="button" onClick={onOpen} className="flex flex-col gap-1 text-left hover:underline">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{idea.title || "Sans titre"}</span>
        <span className="text-xs text-muted-foreground ">
          {themeLabel ?? "Sans thématique"} ·{" "}
          {idea.scheduledFor ? dateFormatter.format(new Date(idea.scheduledFor)) : "Sans date"}
        </span>
      </button>
    </div>
  );
}
