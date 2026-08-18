"use client";

import { useMemo, useState } from "react";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useIdeaStatusLabel } from "@/lib/idea-status";
import { notePreview, searchNotes, sortNotes, type NoteSortKey } from "@/lib/notes";
import { useThemesSession } from "@/lib/themes-store";
import type { IdeaNote } from "@/types/idea-note";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const FIELD_CLASS = "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700   dark:text-zinc-300";

interface NotesListPanelProps {
  notes: IdeaNote[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  canCreate: boolean;
}

/** Panneau gauche de la vue Notes — liste, recherche, tri, notes archivées. */
export function NotesListPanel({ notes, selectedId, onSelect, onCreate, canCreate }: NotesListPanelProps) {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<NoteSortKey>("updatedAt");
  const [showArchived, setShowArchived] = useState(false);
  const IDEA_STATUS_LABEL = useIdeaStatusLabel();

  const visibleNotes = useMemo(() => {
    const byArchive = notes.filter((note) => (showArchived ? note.archiveStatus === "archived" : note.archiveStatus === "active"));
    return sortNotes(searchNotes(byArchive, query), sortKey);
  }, [notes, query, sortKey, showArchived]);

  function themeLabelFor(note: IdeaNote): string | null {
    if (note.themeId) return themes.find((theme) => theme.id === note.themeId)?.label ?? null;
    return note.adhocThemeLabel ?? null;
  }

  return (
    <div className="flex h-full flex-col gap-3 border-r border-border p-3 ">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground ">{t("ideasBank.listView.notes")}</h2>
        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-xs font-semibold text-white"
          >
            + {t("ideasBank.notes.newNote")}
          </button>
        )}
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("ideasBank.notes.searchPlaceholder")}
        className={FIELD_CLASS}
      />

      <div className="flex items-center justify-between gap-2">
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as NoteSortKey)} className={FIELD_CLASS}>
          <option value="updatedAt">{t("ideaWorkshop.propertiesPanel.updatedAtLabel")}</option>
          <option value="createdAt">{t("ideaWorkshop.propertiesPanel.createdAtLabel")}</option>
          <option value="title">{t("ideaWorkshop.versionsPanel.fieldTitle")}</option>
        </select>
        <button type="button" onClick={() => setShowArchived((prev) => !prev)} className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline ">
          {showArchived ? t("calendar.importantDates.viewActive") : t("calendar.importantDates.viewArchived")}
        </button>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {visibleNotes.map((note) => {
          const brand = brands.find((candidate) => candidate.id === note.brandId);
          const themeLabel = themeLabelFor(note);
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelect(note.id)}
              className={`flex flex-col gap-1 rounded-lg border p-2.5 text-left ${
                selectedId === note.id
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-500/10"
                  : "border-border hover:border-zinc-400  dark:hover:border-white/[.16]"
              }`}
            >
              <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{note.title || t("publications.card.untitled")}</span>
              {notePreview(note) && <span className="line-clamp-2 text-xs text-muted-foreground ">{notePreview(note)}</span>}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground ">
                <span>{dateFormatter.format(new Date(note.updatedAt))}</span>
                {brand && <span className="rounded-full bg-muted px-1.5 py-0.5">{brand.name}</span>}
                {themeLabel && <span className="rounded-full bg-muted px-1.5 py-0.5">{themeLabel}</span>}
                {note.status && <span className="rounded-full bg-muted px-1.5 py-0.5">{IDEA_STATUS_LABEL[note.status]}</span>}
              </div>
            </button>
          );
        })}
        {visibleNotes.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-muted-foreground dark:border-white/[.12] ">
            {showArchived ? t("ideasBank.notes.noArchivedNotes") : t("ideasBank.notes.noNotesYet")}
          </p>
        )}
      </div>
    </div>
  );
}
