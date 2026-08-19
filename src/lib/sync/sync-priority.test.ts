import { describe, expect, it } from "vitest";
import { SYNC_PRIORITY } from "@/lib/sync/runtime";

/**
 * Vérifie l'invariant qui corrige le bug `topics_idea_id_fkey` (voir develop-idea.ts,
 * ensureIdeaForTopic/ensureIdeaForNote) : un enregistrement référencé par un autre via une clé
 * étrangère Supabase doit toujours avoir une priorité de synchronisation strictement inférieure
 * (donc être traité avant), même quand les deux opérations sont créées dans la même action
 * utilisateur et mises en file dans un ordre local non garanti (déterminé par l'ordre de
 * déclaration des hooks React entre magasins, un détail d'implémentation).
 */
describe("SYNC_PRIORITY — ordre de dépendance entre entités synchronisées", () => {
  it("synchronise topicBatches avant ideas (ideas.batch_id)", () => {
    expect(SYNC_PRIORITY.topicBatches).toBeLessThan(SYNC_PRIORITY.ideas);
  });

  it("synchronise ideas avant topics (topics.idea_id)", () => {
    expect(SYNC_PRIORITY.ideas).toBeLessThan(SYNC_PRIORITY.topics);
  });

  it("synchronise ideas avant ideaNotes (idea_notes.converted_idea_id)", () => {
    expect(SYNC_PRIORITY.ideas).toBeLessThan(SYNC_PRIORITY.ideaNotes);
  });

  it("synchronise ideas avant contentVersions (content_versions.idea_id)", () => {
    expect(SYNC_PRIORITY.ideas).toBeLessThan(SYNC_PRIORITY.contentVersions);
  });

  it("synchronise posts avant ideas (ideas.publication_id, voir IdeaWorkshopView.handleCreatePublication)", () => {
    expect(SYNC_PRIORITY.posts).toBeLessThan(SYNC_PRIORITY.ideas);
  });

  it("un tri stable par SYNC_PRIORITY place toujours ideas avant topics quel que soit l'ordre d'enfilement initial", () => {
    const operations = [
      { entityType: "topics" as const, recordId: "topic-1" },
      { entityType: "ideas" as const, recordId: "idea-1" },
    ];
    const sorted = [...operations].sort((a, b) => SYNC_PRIORITY[a.entityType] - SYNC_PRIORITY[b.entityType]);
    expect(sorted.map((op) => op.entityType)).toEqual(["ideas", "topics"]);
  });
});
