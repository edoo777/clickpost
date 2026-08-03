"use client";

import { useRouter } from "next/navigation";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { useIdeaNotesSession } from "@/lib/idea-notes-store";
import { plainTextToDocument } from "@/lib/rich-document";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";
import type { IdeaNote } from "@/types/idea-note";
import type { Topic, TopicBatch } from "@/types/topic-batch";

export interface IdeaSeed {
  brandId: string;
  title: string;
  description?: string;
  platform?: SocialPlatform;
  format?: ContentFormat;
  body?: string;
  quickNotes?: string;
}

/** Construit une nouvelle Idée à partir d'un point de départ arbitraire (recyclage d'une
 * publication, variante, test éditorial…) — jamais persistée ici, seulement construite ; à passer
 * à `addIdea` par l'appelant. Centralise cette construction pour éviter que chaque point d'entrée
 * (Tendances, Recycler une publication, Optimisation) ne la réimplémente légèrement différemment. */
export function buildIdeaFromSeed(seed: IdeaSeed): Idea {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    brandId: seed.brandId,
    title: seed.title,
    description: seed.description,
    source: "manual",
    status: "idea",
    platform: seed.platform,
    format: seed.format,
    documentContent: seed.body ? plainTextToDocument(seed.body) : undefined,
    body: seed.body,
    quickNotes: seed.quickNotes,
    workshopDisplayMode: "document",
    createdAt: now,
    updatedAt: now,
  };
}

export type DevelopMode = "manual" | "ai";

/**
 * Point d'entrée unique du parcours Sujet/Note → Idée → Atelier, utilisé par le Générateur de
 * sujets, les trois vues classiques de la Banque d'idées et la vue Notes. Toute la logique de
 * dé-duplication (un sujet ou une note ne doit jamais produire deux idées, même en cas de
 * double-clic) vit ici et nulle part ailleurs. N'ouvre jamais un second Atelier : toujours
 * `/atelier/{id}`, l'écran existant.
 */
export function useDevelopIdea() {
  const router = useRouter();
  const { ideas, addIdea, updateTopic } = useContentWorkspace();
  const { updateNote } = useIdeaNotesSession();

  function ensureIdeaForTopic(topic: Topic, batch: TopicBatch): Idea {
    if (topic.ideaId) {
      const existing = ideas.find((candidate) => candidate.id === topic.ideaId);
      if (existing) return existing;
    }
    const now = new Date().toISOString();
    const idea: Idea = {
      id: crypto.randomUUID(),
      brandId: batch.brandId,
      themeId: batch.themeId,
      adhocThemeLabel: batch.themeId ? undefined : batch.adhocThemeLabel,
      batchId: batch.id,
      title: topic.label,
      source: "generated",
      status: "idea",
      platform: batch.platforms[0],
      format: batch.formats[0],
      objective: batch.objective,
      targetAudience: batch.targetAudience,
      contentType: topic.contentType,
      createdAt: now,
      updatedAt: now,
    };
    addIdea(idea);
    updateTopic(topic.id, { ideaId: idea.id, selected: false });
    return idea;
  }

  /** Crée (ou réutilise, via note.convertedIdeaId) l'idée correspondant à une note — la note
   * n'est jamais supprimée ni modifiée au-delà de l'enregistrement de ce lien. Le contenu riche
   * est transmis tel quel (même format Tiptap que documentContent), jamais aplati en texte brut
   * uniquement. */
  function ensureIdeaForNote(note: IdeaNote): Idea {
    if (note.convertedIdeaId) {
      const existing = ideas.find((candidate) => candidate.id === note.convertedIdeaId);
      if (existing) return existing;
    }
    const now = new Date().toISOString();
    const idea: Idea = {
      id: crypto.randomUUID(),
      brandId: note.brandId ?? "",
      themeId: note.themeId,
      adhocThemeLabel: note.themeId ? undefined : note.adhocThemeLabel,
      title: note.title || "Sans titre",
      source: "manual",
      status: note.status ?? "idea",
      priority: note.priority,
      platform: note.platform,
      format: note.format,
      objective: note.objective,
      owner: note.owner,
      contentType: note.contentType,
      documentContent: note.content,
      body: note.bodyText,
      workshopDisplayMode: "document",
      createdAt: now,
      updatedAt: now,
    };
    addIdea(idea);
    updateNote(note.id, { convertedIdeaId: idea.id });
    return idea;
  }

  function developTopic(topic: Topic, batch: TopicBatch, mode: DevelopMode) {
    const idea = ensureIdeaForTopic(topic, batch);
    router.push(`/atelier/${idea.id}?mode=${mode}`);
  }

  function registerTopicAsIdea(topic: Topic, batch: TopicBatch): Idea {
    return ensureIdeaForTopic(topic, batch);
  }

  /** « Convertir en idée » — crée l'idée dans la Banque, ne navigue pas, ne supprime jamais la
   * note d'origine. */
  function convertNoteToIdea(note: IdeaNote): Idea {
    return ensureIdeaForNote(note);
  }

  /** « Développer dans la production » depuis une note — mêmes garanties que convertNoteToIdea,
   * puis ouvre l'Atelier existant. Ne publie jamais automatiquement. */
  function developNote(note: IdeaNote, mode: DevelopMode) {
    const idea = ensureIdeaForNote(note);
    router.push(`/atelier/${idea.id}?mode=${mode}`);
  }

  function developIdea(idea: Idea, mode: DevelopMode) {
    router.push(`/atelier/${idea.id}?mode=${mode}`);
  }

  return { developTopic, developIdea, registerTopicAsIdea, convertNoteToIdea, developNote };
}
