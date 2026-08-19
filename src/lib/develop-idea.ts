"use client";

import { useRouter } from "next/navigation";
import { useAccountsSession } from "@/lib/accounts-store";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { useIdeaNotesSession } from "@/lib/idea-notes-store";
import { buildPostInputFromIdea } from "@/lib/idea-transformation";
import { buildNewPost } from "@/lib/posts";
import { usePostsSession } from "@/lib/posts-store";
import { plainTextToDocument } from "@/lib/rich-document";
import { useThemesSession } from "@/lib/themes-store";
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
  /** Identifiant de la Publication d'origine dont cette idée est une réutilisation — voir
   * "Réutiliser ce contenu" (src/components/publications/RepurposeContentModal.tsx). Absent pour
   * une idée créée à partir de rien. */
  derivedFromId?: string;
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
    derivedFromId: seed.derivedFromId,
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
  const { ideas, addIdea, updateIdea, updateTopic } = useContentWorkspace();
  const { updateNote } = useIdeaNotesSession();
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const { accounts } = useAccountsSession();
  const { addPosts } = usePostsSession();

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
      angle: topic.angle,
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

  /** `instructions` : demande libre de l'utilisateur (ex. depuis le menu « Développer avec l'IA »
   * — script vidéo, structuration, instruction personnalisée) — transmise à l'Atelier via un
   * paramètre d'URL, jamais stockée sur l'idée elle-même. Lue par IdeaWorkshopView pour la
   * génération automatique déclenchée à l'ouverture en mode IA (voir son effet `requestedMode`) ;
   * sans effet en mode manuel. */
  function developTopic(topic: Topic, batch: TopicBatch, mode: DevelopMode, instructions?: string) {
    const idea = ensureIdeaForTopic(topic, batch);
    const query = mode === "ai" && instructions ? `&instructions=${encodeURIComponent(instructions)}` : "";
    router.push(`/atelier/${idea.id}?mode=${mode}${query}`);
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
  function developNote(note: IdeaNote, mode: DevelopMode, instructions?: string) {
    const idea = ensureIdeaForNote(note);
    const query = mode === "ai" && instructions ? `&instructions=${encodeURIComponent(instructions)}` : "";
    router.push(`/atelier/${idea.id}?mode=${mode}${query}`);
  }

  function developIdea(idea: Idea, mode: DevelopMode, instructions?: string) {
    const query = mode === "ai" && instructions ? `&instructions=${encodeURIComponent(instructions)}` : "";
    router.push(`/atelier/${idea.id}?mode=${mode}${query}`);
  }

  /**
   * Crée réellement la Publication associée à une idée (ou réutilise celle déjà liée via
   * `idea.publicationId` — jamais un doublon), pour le raccourci « Créer une publication »/
   * « Planifier » du Générateur de sujets et de la Banque d'idées — des idées qui n'ont jamais été
   * ouvertes dans l'Atelier, donc sans version de contenu à sérialiser (voir
   * `serializeVersionToText`, repli sur les champs à plat de l'idée). Distinct de
   * `IdeaWorkshopView.handleCreatePublication` (qui sérialise la version active affichée dans
   * l'Atelier) — même finalité, contexte de données différent, volontairement non fusionnés. Ne
   * fait jamais rien si aucun réseau n'est défini sur l'idée — l'appelant doit vérifier
   * `idea.platform` avant d'activer l'action (voir `canCreatePublication`).
   */
  function ensurePublicationForIdea(idea: Idea): { id: string } | null {
    if (!idea.platform) return null;
    if (idea.publicationId) {
      // Réutilisation explicite — jamais une seconde publication pour la même idée, quel que soit
      // le nombre de clics. La publication elle-même n'est pas relue ici (non nécessaire : seul
      // son identifiant sert à la navigation), voir la page /publications/{id} pour son état réel.
      return { id: idea.publicationId };
    }
    const brand = brands.find((candidate) => candidate.id === idea.brandId);
    const brandName = brand?.name ?? idea.brandId;
    const theme = themes.find((candidate) => candidate.id === idea.themeId);
    const account =
      accounts.find((candidate) => candidate.brand === brandName && candidate.platform === idea.platform && candidate.status === "connected") ??
      accounts.find((candidate) => candidate.brand === brandName && candidate.status === "connected");
    const input = buildPostInputFromIdea(idea, undefined, brandName, theme?.label ?? "");
    const publication = buildNewPost({ ...input, accountId: account?.id });
    addPosts([publication]);
    updateIdea(idea.id, { publicationId: publication.id, status: "ready_to_schedule" });
    return publication;
  }

  function canCreatePublication(idea: Idea): boolean {
    return Boolean(idea.platform);
  }

  /** « Créer une publication » — ouvre l'éditeur de publication existant (mêmes champs, mêmes
   * garanties qu'un clic dans l'Atelier), pour affiner texte/CTA/hashtags avant programmation. */
  function createPublicationAndOpen(idea: Idea) {
    const publication = ensurePublicationForIdea(idea);
    if (!publication) return;
    router.push(`/publications/${publication.id}`);
  }

  /** « Planifier » — même publication (créée si nécessaire), mais atterrit sur le calendrier
   * plutôt que l'éditeur : action distincte de « Créer une publication », pensée pour poser
   * directement une date plutôt que retravailler le contenu. */
  function createPublicationAndSchedule(idea: Idea) {
    const publication = ensurePublicationForIdea(idea);
    if (!publication) return;
    router.push("/calendrier");
  }

  return {
    developTopic,
    developIdea,
    registerTopicAsIdea,
    convertNoteToIdea,
    developNote,
    canCreatePublication,
    createPublicationAndOpen,
    createPublicationAndSchedule,
  };
}
