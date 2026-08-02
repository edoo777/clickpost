"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import type { IdeaNote } from "@/types/idea-note";

interface IdeaNotesSessionValue {
  notes: IdeaNote[];
  addNote: (note: IdeaNote) => void;
  updateNote: (id: string, patch: Partial<IdeaNote>) => void;
  archiveNote: (id: string) => void;
  restoreNote: (id: string) => void;
  removeNote: (id: string) => void;
  getNoteById: (id: string) => IdeaNote | undefined;
}

const IdeaNotesSessionContext = createContext<IdeaNotesSessionValue | null>(null);

/**
 * Notes libres de la Banque d'idées (vue « Notes ») — entité indépendante de Idea (voir
 * types/idea-note.ts). Même patron que important-dates-store.tsx : synchronisation
 * IndexedDB/Supabase déjà entièrement gérée par useSyncedPersistedState, aucun moteur propre.
 */
export function IdeaNotesSessionProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useSyncedPersistedState("ideaNotes", [], "ideaNotes");

  const value = useMemo<IdeaNotesSessionValue>(
    () => ({
      notes,
      addNote: (note) => setNotes((prev) => [...prev, note]),
      updateNote: (id, patch) =>
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
        ),
      archiveNote: (id) =>
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? { ...note, archiveStatus: "archived", updatedAt: new Date().toISOString() } : note))
        ),
      restoreNote: (id) =>
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? { ...note, archiveStatus: "active", updatedAt: new Date().toISOString() } : note))
        ),
      removeNote: (id) => setNotes((prev) => prev.filter((note) => note.id !== id)),
      getNoteById: (id) => notes.find((note) => note.id === id),
    }),
    [notes, setNotes]
  );

  return <IdeaNotesSessionContext.Provider value={value}>{children}</IdeaNotesSessionContext.Provider>;
}

export function useIdeaNotesSession() {
  const context = useContext(IdeaNotesSessionContext);
  if (!context) {
    throw new Error("useIdeaNotesSession must be used within an IdeaNotesSessionProvider");
  }
  return context;
}
