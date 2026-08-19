"use client";

import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SlashCommand } from "@/components/idea-workshop/editor/slash-command-extension";
import { NoteEditorToolbar } from "@/components/ideas-bank/notes/NoteEditorToolbar";
import { NotePropertiesPanel } from "@/components/ideas-bank/notes/NotePropertiesPanel";
import { NoteQuickActionsMenu } from "@/components/ideas-bank/notes/NoteQuickActionsMenu";
import { DevelopMenu } from "@/components/shared/DevelopMenu";
import { MoreActionsMenu } from "@/components/shared/MoreActionsMenu";
import { useBrandsSession } from "@/lib/brands-store";
import { useDevelopIdea } from "@/lib/develop-idea";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useIdeaNotesSession } from "@/lib/idea-notes-store";
import { buildNewNote, duplicateNote } from "@/lib/notes";
import { flushNow, getStatusServerSnapshot, getStatusSnapshot, subscribeStatus } from "@/lib/persistence/coordinator";
import { documentToPlainText, EMPTY_DOCUMENT, plainTextToDocument } from "@/lib/rich-document";
import { useSyncStatus } from "@/lib/sync/use-sync-status";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { RichDocument } from "@/types/rich-document";
import type { IdeaNote } from "@/types/idea-note";

const updatedAtFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return isOnline;
}

interface NoteEditorProps {
  note: IdeaNote;
  onSelectNote: (id: string) => void;
  onDeleted: () => void;
}

/**
 * Éditeur de la note sélectionnée — page blanche de type Notion. Réutilise Tiptap et les
 * extensions déjà installées (StarterKit, listes de tâches, liens, placeholder, commande « / »
 * importée telle quelle depuis l'Atelier), plus Underline (nouvelle dépendance approuvée).
 * Sauvegarde automatique : chaque modification appelle updateNote() directement, exactement
 * comme WorkshopEditor le fait pour Idea.documentContent — aucun moteur de sauvegarde parallèle.
 * Remonte un éditeur neuf à chaque changement de note (le parent doit passer `key={note.id}`).
 */
export function NoteEditor({ note, onSelectNote, onDeleted }: NoteEditorProps) {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const { updateNote, archiveNote, restoreNote, removeNote, addNote } = useIdeaNotesSession();
  const { convertNoteToIdea, canCreatePublication, createPublicationAndOpen } = useDevelopIdea();
  const { role, isAdmin, isLoading: isWorkspaceLoading, workspaceError, userId } = useWorkspaceSession();
  const saveStatus = useSyncExternalStore(subscribeStatus, getStatusSnapshot, getStatusServerSnapshot);
  const syncStatus = useSyncStatus();
  const isOnline = useOnlineStatus();
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const canEdit = Boolean(role) && !isWorkspaceLoading && !workspaceError;
  const canDestruct = isAdmin;
  const brand = brands.find((candidate) => candidate.id === note.brandId);

  useEffect(() => {
    if (!confirmation) return;
    const timeout = setTimeout(() => setConfirmation(null), 4000);
    return () => clearTimeout(timeout);
  }, [confirmation]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    content: (note.content ?? EMPTY_DOCUMENT) as JSONContent,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: t("ideasBank.noteEditor.editorPlaceholder") }),
      SlashCommand,
    ],
    editorProps: {
      attributes: { class: "workshop-prose focus:outline-none min-h-[20rem]" },
    },
    onUpdate: ({ editor: instance }) => {
      const doc = instance.getJSON() as RichDocument;
      updateNote(note.id, { content: doc, bodyText: documentToPlainText(doc) });
    },
  });

  function statusLabel(): { text: string; tone: "muted" | "warning" | "error" } {
    if (!isOnline) return { text: t("ideasBank.noteEditor.statusOffline"), tone: "warning" };
    if (saveStatus.status === "pending") return { text: t("ideasBank.noteEditor.statusPending"), tone: "muted" };
    if (saveStatus.status === "saving") return { text: t("common.saving"), tone: "muted" };
    if (saveStatus.status === "error") return { text: t("ideasBank.noteEditor.statusError"), tone: "error" };
    if (syncStatus.status === "conflict") return { text: t("ideasBank.noteEditor.statusConflict"), tone: "error" };
    if (syncStatus.status === "error") {
      if (syncStatus.hasPermissionError) return { text: t("ideasBank.noteEditor.statusPermissionDenied"), tone: "error" };
      if (syncStatus.hasBlockedOperations) return { text: t("ideasBank.noteEditor.statusLocalDataToRepair"), tone: "error" };
      if (syncStatus.isPersistentError) return { text: t("ideasBank.noteEditor.statusPersistentError"), tone: "error" };
      return { text: t("ideasBank.noteEditor.statusSyncInterrupted"), tone: "error" };
    }
    return { text: t("ideasBank.noteEditor.statusSavedAt", { date: updatedAtFormatter.format(new Date(note.updatedAt)) }), tone: "muted" };
  }
  const status = statusLabel();

  function handleDuplicate() {
    const copy = duplicateNote(note);
    addNote(copy);
    onSelectNote(copy.id);
    setConfirmation(t("ideasBank.noteEditor.noteDuplicated"));
  }

  function handleArchiveToggle() {
    if (note.archiveStatus === "archived") restoreNote(note.id);
    else archiveNote(note.id);
  }

  function handleDelete() {
    if (!window.confirm(t("ideasBank.noteEditor.confirmDeleteNote", { title: note.title || t("publications.card.untitled") }))) return;
    removeNote(note.id);
    onDeleted();
  }

  function handleCreatePublication() {
    const idea = convertNoteToIdea(note);
    if (!canCreatePublication(idea)) {
      setConfirmation(t("ideasBank.noteEditor.selectNetworkFirst"));
      return;
    }
    createPublicationAndOpen(idea);
  }

  function handleCreateCopyFromAi(text: string) {
    const copy = buildNewNote({
      createdBy: userId ?? "",
      brandId: note.brandId,
      standaloneNiche: note.standaloneNiche,
      themeId: note.themeId,
      adhocThemeLabel: note.adhocThemeLabel,
      title: t("ideasBank.noteEditor.aiCopyTitle", { title: note.title || t("publications.card.untitled") }),
    });
    copy.content = plainTextToDocument(text);
    copy.bodyText = text;
    addNote(copy);
    onSelectNote(copy.id);
    setConfirmation(t("ideasBank.noteEditor.copyCreatedNotice"));
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      {confirmation && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {confirmation}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          value={note.title}
          onChange={(event) => updateNote(note.id, { title: event.target.value })}
          disabled={!canEdit}
          placeholder={t("ideasBank.noteEditor.titlePlaceholder")}
          className="min-w-0 flex-1 border-none bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <span
          role="status"
          className={`shrink-0 text-xs font-medium ${
            status.tone === "error" ? "text-red-600 dark:text-red-400" : status.tone === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          }`}
        >
          {status.text}
        </span>
      </div>

      {note.archiveStatus === "archived" && (
        <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {t("ideasBank.noteEditor.archivedNotice")}
        </p>
      )}
      {!canEdit && (
        <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {t("ideasBank.noteEditor.readOnlyNotice")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => flushNow()} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300">
          {t("common.save")}
        </button>
        <DevelopMenu variant="note" note={note} />
        <button
          type="button"
          onClick={handleCreatePublication}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white"
        >
          {t("ideasBank.noteEditor.createPublication")}
        </button>
        <NoteQuickActionsMenu editor={editor} noteTitle={note.title} brandTone={brand?.toneOfVoice} onCreateCopy={handleCreateCopyFromAi} />
        <MoreActionsMenu
          items={[
            ...(canEdit ? [{ key: "duplicate", label: t("ideaWorkshop.versionsPanel.duplicate"), onClick: handleDuplicate }] : []),
            ...(canDestruct
              ? [
                  {
                    key: "archive",
                    label: note.archiveStatus === "archived" ? t("ideaWorkshop.versionsPanel.restore") : t("calendar.importantDates.archive"),
                    onClick: handleArchiveToggle,
                  },
                  { key: "delete", label: t("common.delete"), onClick: handleDelete, destructive: true },
                ]
              : []),
          ]}
        />
      </div>

      <NotePropertiesPanel note={note} onChange={(patch) => updateNote(note.id, patch)} />

      <div className="flex flex-col gap-3">
        <NoteEditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
