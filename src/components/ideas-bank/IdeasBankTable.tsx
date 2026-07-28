"use client";

import { IDEA_STATUS_LABEL, IDEA_STATUS_STYLE } from "@/lib/idea-status";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { useThemesSession } from "@/lib/themes-store";
import type { Idea } from "@/types/idea";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface IdeasBankTableProps {
  ideas: Idea[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export function IdeasBankTable({ ideas, selectedIds, onToggleSelect, onOpen }: IdeasBankTableProps) {
  const { themes } = useThemesSession();

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-white/[.08] dark:bg-zinc-950">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-white/[.06] dark:text-zinc-600">
            <th className="px-4 py-3" />
            <th className="px-4 py-3">Titre</th>
            <th className="px-4 py-3">Thématique</th>
            <th className="px-4 py-3">Réseau</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-white/[.06]">
          {ideas.map((idea) => {
            const themeLabel = themes.find((theme) => theme.id === idea.themeId)?.label;
            return (
              <tr key={idea.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(idea.id)}
                    onChange={() => onToggleSelect(idea.id)}
                    aria-label="Sélectionner cette idée"
                  />
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <button type="button" onClick={() => onOpen(idea.id)} className="hover:underline">
                    {idea.title || "Sans titre"}
                  </button>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{themeLabel ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {idea.platform ? PLATFORM_LABEL[idea.platform] : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {idea.scheduledFor ? dateFormatter.format(new Date(idea.scheduledFor)) : "Sans date"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}
                  >
                    {IDEA_STATUS_LABEL[idea.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {idea.source === "generated" ? "Générée" : "Manuelle"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
