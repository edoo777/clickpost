"use client";

import { useRouter } from "next/navigation";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import type { Idea } from "@/types/idea";
import type { Topic, TopicBatch } from "@/types/topic-batch";

export type DevelopMode = "manual" | "ai";

/**
 * Point d'entrée unique du parcours Sujet → Idée → Atelier, utilisé par le Générateur de sujets
 * et les trois modes de la Banque d'idées. Toute la logique de dé-duplication (un sujet ne doit
 * jamais produire deux idées, même en cas de double-clic) vit ici et nulle part ailleurs.
 */
export function useDevelopIdea() {
  const router = useRouter();
  const { ideas, addIdea, updateTopic } = useContentWorkspace();

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

  function developTopic(topic: Topic, batch: TopicBatch, mode: DevelopMode) {
    const idea = ensureIdeaForTopic(topic, batch);
    router.push(`/atelier/${idea.id}?mode=${mode}`);
  }

  function registerTopicAsIdea(topic: Topic, batch: TopicBatch): Idea {
    return ensureIdeaForTopic(topic, batch);
  }

  function developIdea(idea: Idea, mode: DevelopMode) {
    router.push(`/atelier/${idea.id}?mode=${mode}`);
  }

  return { developTopic, developIdea, registerTopicAsIdea };
}
