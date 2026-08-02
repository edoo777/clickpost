import { EMPTY_DOCUMENT } from "@/lib/rich-document";
import type { IdeaNote } from "@/types/idea-note";

export interface NewNoteInput {
  createdBy: string;
  brandId?: string;
  standaloneNiche?: string;
  themeId?: string;
  adhocThemeLabel?: string;
  title?: string;
}

export function buildNewNote(input: NewNoteInput): IdeaNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    brandId: input.brandId,
    standaloneNiche: input.standaloneNiche,
    themeId: input.themeId,
    adhocThemeLabel: input.adhocThemeLabel,
    title: input.title ?? "",
    content: EMPTY_DOCUMENT,
    bodyText: "",
    archiveStatus: "active",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateNote(note: IdeaNote): IdeaNote {
  const now = new Date().toISOString();
  return {
    ...note,
    id: crypto.randomUUID(),
    title: `${note.title || "Sans titre"} (copie)`,
    convertedIdeaId: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function searchNotes(notes: IdeaNote[], query: string): IdeaNote[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return notes;
  return notes.filter((note) => `${note.title} ${note.bodyText}`.toLowerCase().includes(normalized));
}

export type NoteSortKey = "updatedAt" | "createdAt" | "title";

export function sortNotes(notes: IdeaNote[], sortKey: NoteSortKey): IdeaNote[] {
  const sorted = [...notes];
  if (sortKey === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime());
  }
  return sorted;
}

const PREVIEW_LENGTH = 140;

export function notePreview(note: IdeaNote): string {
  const flat = note.bodyText.replace(/\s+/g, " ").trim();
  if (flat.length <= PREVIEW_LENGTH) return flat;
  return `${flat.slice(0, PREVIEW_LENGTH).trim()}…`;
}
