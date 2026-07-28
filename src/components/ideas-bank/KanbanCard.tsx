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
      className={`flex cursor-grab flex-col gap-2 rounded-lg border bg-white p-3 active:cursor-grabbing dark:bg-zinc-950 ${
        isSelected
          ? "border-zinc-950 dark:border-zinc-50"
          : "border-black/[.08] hover:border-black/[.16] dark:border-white/[.08] dark:hover:border-white/[.16]"
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
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            {PRIORITY_LABEL[idea.priority]}
          </span>
        )}
      </div>

      <button type="button" onClick={onOpen} className="flex flex-col gap-1 text-left hover:underline">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{idea.title || "Sans titre"}</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-600">
          {themeLabel ?? "Sans thématique"} ·{" "}
          {idea.scheduledFor ? dateFormatter.format(new Date(idea.scheduledFor)) : "Sans date"}
        </span>
      </button>
    </div>
  );
}
