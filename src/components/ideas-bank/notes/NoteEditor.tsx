"use client";

import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SlashCommand } from "@/components/idea-workshop/editor/slash-command-extension";
import { NoteEditorToolbar } from "@/components/ideas-bank/notes/NoteEditorToolbar";
import { NotePropertiesPanel } from "@/components/ideas-bank/notes/NotePropertiesPanel";
import { NoteQuickActionsMenu } from "@/components/ideas-bank/notes/NoteQuickActionsMenu";
import { useBrandsSession } from "@/lib/brands-store";
import { useDevelopIdea } from "@/lib/develop-idea";
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
  const router = useRouter();
  const { brands } = useBrandsSession();
  const { updateNote, archiveNote, restoreNote, removeNote, addNote } = useIdeaNotesSession();
  const { convertNoteToIdea, developNote } = useDevelopIdea();
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
      Placeholder.configure({ placeholder: "Écrivez librement, ou tapez « / » pour insérer un bloc…" }),
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
    if (!isOnline) return { text: "Hors ligne", tone: "warning" };
    if (saveStatus.status === "pending") return { text: "Modification en cours…", tone: "muted" };
    if (saveStatus.status === "saving") return { text: "Enregistrement…", tone: "muted" };
    if (saveStatus.status === "error") return { text: "Erreur de synchronisation", tone: "error" };
    if (syncStatus.status === "conflict" || syncStatus.status === "error") return { text: "Erreur de synchronisation", tone: "error" };
    return { text: `Enregistré à ${updatedAtFormatter.format(new Date(note.updatedAt))}`, tone: "muted" };
  }
  const status = statusLabel();

  function handleDuplicate() {
    const copy = duplicateNote(note);
    addNote(copy);
    onSelectNote(copy.id);
    setConfirmation("Note dupliquée.");
  }

  function handleArchiveToggle() {
    if (note.archiveStatus === "archived") restoreNote(note.id);
    else archiveNote(note.id);
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer définitivement la note « ${note.title || "Sans titre"} » ?`)) return;
    removeNote(note.id);
    onDeleted();
  }

  function handleConvertToIdea() {
    // Une fois l'idée créée, ce même bouton devient un raccourci direct vers l'Atelier — jamais
    // un deuxième clic qui recréerait une idée en double (ensureIdeaForNote() est déjà idempotent
    // via note.convertedIdeaId, mais autant naviguer directement plutôt que ré-afficher un toast).
    if (note.convertedIdeaId) {
      router.push(`/atelier/${note.convertedIdeaId}`);
      return;
    }
    convertNoteToIdea(note);
    setConfirmation("Idée créée dans la Banque d'idées — cliquez à nouveau sur ce bouton pour l'ouvrir dans l'Atelier.");
  }

  function handleDevelop() {
    developNote(note, "manual");
  }

  function handleCreateCopyFromAi(text: string) {
    const copy = buildNewNote({
      createdBy: userId ?? "",
      brandId: note.brandId,
      standaloneNiche: note.standaloneNiche,
      themeId: note.themeId,
      adhocThemeLabel: note.adhocThemeLabel,
      title: `${note.title || "Sans titre"} (IA)`,
    });
    copy.content = plainTextToDocument(text);
    copy.bodyText = text;
    addNote(copy);
    onSelectNote(copy.id);
    setConfirmation("Copie créée avec le résultat de l'IA.");
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
          placeholder="Titre de la note"
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
        <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">Note archivée.</p>
      )}
      {!canEdit && (
        <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          Lecture seule — votre rôle ne permet pas la modification.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => flushNow()} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300">
          Enregistrer
        </button>
        <button type="button" onClick={handleDuplicate} disabled={!canEdit} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300">
          Dupliquer
        </button>
        {canDestruct && (
          <>
            <button type="button" onClick={handleArchiveToggle} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300">
              {note.archiveStatus === "archived" ? "Restaurer" : "Archiver"}
            </button>
            <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10">
              Supprimer
            </button>
          </>
        )}
        <button type="button" onClick={handleConvertToIdea} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white">
          {note.convertedIdeaId ? "Ouvrir l'idée dans l'Atelier" : "Convertir en idée"}
        </button>
        <button type="button" onClick={handleDevelop} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white">
          Développer dans la production
        </button>
        <NoteQuickActionsMenu editor={editor} noteTitle={note.title} brandTone={brand?.toneOfVoice} onCreateCopy={handleCreateCopyFromAi} />
      </div>

      <NotePropertiesPanel note={note} onChange={(patch) => updateNote(note.id, patch)} />

      <div className="flex flex-col gap-3">
        <NoteEditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
