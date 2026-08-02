"use client";

import { useState } from "react";
import { DevelopMenu } from "@/components/shared/DevelopMenu";
import { QuickActionsMenu } from "@/components/ideas-bank/QuickActionsMenu";
import { useBrandsSession } from "@/lib/brands-store";
import { ALL_CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { IDEA_STATUS_LABEL, IDEA_STATUS_ORDER, PRIORITY_LABEL } from "@/lib/idea-status";
import { buildNewIdea } from "@/lib/ideas";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { getThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";
import type { ContentPriority } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];

const createdFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const CELL_SELECT_CLASS = "w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-xs text-zinc-700 hover:border-border focus:border-border focus:bg-white dark:text-zinc-300 dark:focus:bg-zinc-900";
const CELL_INPUT_CLASS = "w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-xs text-zinc-700 hover:border-border focus:border-border focus:bg-white dark:text-zinc-300 dark:focus:bg-zinc-900";

interface IdeasBankTableProps {
  ideas: Idea[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
  defaultBrandId: string;
}

/** Cellule texte éditable directement — validation locale (évite un appel de sauvegarde à
 * chaque frappe), commit au blur ou à Entrée, comme une cellule de tableau Notion. */
function InlineTextCell({ value, placeholder, onCommit, className }: { value: string; placeholder?: string; onCommit: (next: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") (event.target as HTMLInputElement).blur();
        if (event.key === "Escape") {
          setDraft(value);
          (event.target as HTMLInputElement).blur();
        }
      }}
      className={className ?? CELL_INPUT_CLASS}
    />
  );
}

export function IdeasBankTable({ ideas, selectedIds, onToggleSelect, onOpen, defaultBrandId }: IdeasBankTableProps) {
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const { addIdea, updateIdea } = useContentWorkspace();
  const [newTitle, setNewTitle] = useState("");

  function set<K extends keyof Idea>(idea: Idea, key: K, value: Idea[K]) {
    updateIdea(idea.id, { [key]: value } as Partial<Idea>);
  }

  function createQuickIdea() {
    const title = newTitle.trim();
    if (!title) return;
    addIdea(buildNewIdea({ brandId: defaultBrandId, title }));
    setNewTitle("");
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface  ">
      <table className="w-full min-w-[1400px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground  ">
            <th className="px-3 py-3" />
            <th className="px-3 py-3">Titre</th>
            <th className="px-3 py-3">Notes</th>
            <th className="px-3 py-3">Marque</th>
            <th className="px-3 py-3">Niche</th>
            <th className="px-3 py-3">Thématique</th>
            <th className="px-3 py-3">Type de contenu</th>
            <th className="px-3 py-3">Format</th>
            <th className="px-3 py-3">Objectif</th>
            <th className="px-3 py-3">Plateforme</th>
            <th className="px-3 py-3">Statut</th>
            <th className="px-3 py-3">Priorité</th>
            <th className="px-3 py-3">Créée le</th>
            <th className="px-3 py-3">Date prévue</th>
            <th className="px-3 py-3">Responsable</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border ">
          {ideas.map((idea) => {
            const brand = brands.find((candidate) => candidate.id === idea.brandId);
            const themesForBrand = brand ? getThemesForBrand(themes, brand.id) : [];
            return (
              <tr key={idea.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-3 py-1.5">
                  <input type="checkbox" checked={selectedIds.has(idea.id)} onChange={() => onToggleSelect(idea.id)} aria-label="Sélectionner cette idée" />
                </td>
                <td className="px-3 py-1.5 min-w-[220px]">
                  <InlineTextCell value={idea.title} placeholder="Titre" onCommit={(next) => set(idea, "title", next)} />
                </td>
                <td className="px-3 py-1.5 min-w-[180px]">
                  <InlineTextCell value={idea.quickNotes ?? ""} placeholder="Notes courtes" onCommit={(next) => set(idea, "quickNotes", next || undefined)} />
                </td>
                <td className="px-3 py-1.5 text-muted-foreground ">{brand?.name ?? (idea.brandId ? "—" : "Ponctuelle")}</td>
                <td className="px-3 py-1.5 text-muted-foreground ">{brand?.industry || idea.standaloneNiche || "—"}</td>
                <td className="px-3 py-1.5 min-w-[140px]">
                  <select
                    value={idea.themeId ?? ""}
                    onChange={(event) => set(idea, "themeId", event.target.value || undefined)}
                    className={CELL_SELECT_CLASS}
                  >
                    <option value="">{idea.adhocThemeLabel ? `${idea.adhocThemeLabel} (ponctuelle)` : "Sans thématique"}</option>
                    {themesForBrand.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.label || "Sans titre"}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 min-w-[150px]">
                  <select
                    value={idea.contentType ?? ""}
                    onChange={(event) => set(idea, "contentType", (event.target.value || undefined) as ContentType | undefined)}
                    className={CELL_SELECT_CLASS}
                  >
                    <option value="">Non défini</option>
                    {ALL_CONTENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {CONTENT_TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 min-w-[120px]">
                  <select
                    value={idea.format ?? ""}
                    onChange={(event) => set(idea, "format", (event.target.value || undefined) as ContentFormat | undefined)}
                    className={CELL_SELECT_CLASS}
                  >
                    <option value="">Non défini</option>
                    {CONTENT_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {FORMAT_LABEL[format]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 min-w-[160px]">
                  <InlineTextCell value={idea.objective ?? ""} placeholder="Objectif" onCommit={(next) => set(idea, "objective", next || undefined)} />
                </td>
                <td className="px-3 py-1.5 min-w-[120px]">
                  <select
                    value={idea.platform ?? ""}
                    onChange={(event) => set(idea, "platform", (event.target.value || undefined) as SocialPlatform | undefined)}
                    className={CELL_SELECT_CLASS}
                  >
                    <option value="">Non défini</option>
                    {ALL_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {PLATFORM_LABEL[platform]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 min-w-[140px]">
                  <select value={idea.status} onChange={(event) => set(idea, "status", event.target.value as Idea["status"])} className={CELL_SELECT_CLASS}>
                    {IDEA_STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {IDEA_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 min-w-[110px]">
                  <select
                    value={idea.priority ?? ""}
                    onChange={(event) => set(idea, "priority", (event.target.value || undefined) as ContentPriority | undefined)}
                    className={CELL_SELECT_CLASS}
                  >
                    <option value="">Non définie</option>
                    {ALL_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {PRIORITY_LABEL[priority]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground ">{createdFormatter.format(new Date(idea.createdAt))}</td>
                <td className="px-3 py-1.5 min-w-[150px]">
                  <input
                    type="datetime-local"
                    value={idea.scheduledFor ? idea.scheduledFor.slice(0, 16) : ""}
                    onChange={(event) => set(idea, "scheduledFor", event.target.value ? `${event.target.value}:00` : undefined)}
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-3 py-1.5 min-w-[130px]">
                  <InlineTextCell value={idea.owner ?? ""} placeholder="Responsable" onCommit={(next) => set(idea, "owner", next || undefined)} />
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => onOpen(idea.id)} className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
                      Ouvrir
                    </button>
                    <DevelopMenu variant="idea" idea={idea} compact />
                    <QuickActionsMenu idea={idea} compact />
                  </div>
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="px-3 py-2" />
            <td colSpan={14} className="px-3 py-2">
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") createQuickIdea();
                }}
                onBlur={createQuickIdea}
                placeholder="+ Nouvelle idée — écrivez un titre et appuyez sur Entrée"
                className="w-full max-w-md rounded-lg border border-dashed border-zinc-300 bg-transparent px-2.5 py-1.5 text-sm text-zinc-600 placeholder:text-muted-foreground focus:border-violet-300 dark:border-white/[.16] dark:text-zinc-400"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
