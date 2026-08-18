"use client";

import { useState } from "react";
import { NoteEditor } from "@/components/ideas-bank/notes/NoteEditor";
import { NotesListPanel } from "@/components/ideas-bank/notes/NotesListPanel";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useIdeaNotesSession } from "@/lib/idea-notes-store";
import { buildNewNote } from "@/lib/notes";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

/**
 * Vue « Notes » de la Banque d'idées — espace de rédaction libre inspiré de Notion, distinct des
 * vues Cartes/Tableau/Kanban (qui restent inchangées, lues depuis `ideas`). Deux zones sur
 * ordinateur (liste + éditeur), successives sur mobile.
 */
export function NotesView() {
  const t = useTranslations();
  const { notes, addNote } = useIdeaNotesSession();
  const { activeBrandId } = useBrandsSession();
  const { userId, role, isLoading: isWorkspaceLoading, workspaceError } = useWorkspaceSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEditorOnMobile, setShowEditorOnMobile] = useState(false);

  const canCreate = Boolean(role) && !isWorkspaceLoading && !workspaceError;
  const selectedNote = notes.find((note) => note.id === selectedId) ?? null;

  function handleCreate() {
    const note = buildNewNote({ createdBy: userId ?? "", brandId: activeBrandId ?? undefined });
    addNote(note);
    setSelectedId(note.id);
    setShowEditorOnMobile(true);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowEditorOnMobile(true);
  }

  function handleDeleted() {
    setSelectedId(null);
    setShowEditorOnMobile(false);
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[32rem] flex-col overflow-hidden rounded-xl border border-border bg-surface lg:flex-row  ">
      <div className={`h-full w-full shrink-0 overflow-y-auto lg:block lg:w-80 ${showEditorOnMobile ? "hidden" : "block"}`}>
        <NotesListPanel notes={notes} selectedId={selectedId} onSelect={handleSelect} onCreate={handleCreate} canCreate={canCreate} />
      </div>

      <div className={`h-full min-w-0 flex-1 overflow-y-auto lg:block ${showEditorOnMobile ? "block" : "hidden"}`}>
        {selectedNote ? (
          <>
            <button
              type="button"
              onClick={() => setShowEditorOnMobile(false)}
              className="m-3 w-fit text-xs font-medium text-muted-foreground hover:underline lg:hidden"
            >
              ← {t("ideasBank.notes.backToNotes")}
            </button>
            <NoteEditor key={selectedNote.id} note={selectedNote} onSelectNote={handleSelect} onDeleted={handleDeleted} />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-foreground ">{t("ideasBank.notes.noNoteSelected")}</p>
            <p className="max-w-xs text-xs text-muted-foreground ">{t("ideasBank.notes.noNoteSelectedHint")}</p>
            {canCreate && (
              <button type="button" onClick={handleCreate} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">
                + {t("ideasBank.notes.newNote")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
