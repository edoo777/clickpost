"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ContentVersion } from "@/types/content-version";
import type { Idea } from "@/types/idea";
import type { SavedView } from "@/types/saved-view";
import type { Topic, TopicBatch } from "@/types/topic-batch";
import type { WorkflowStage } from "@/types/workflow-stage";

interface ContentWorkspaceValue {
  topicBatches: TopicBatch[];
  topics: Topic[];
  ideas: Idea[];
  contentVersions: ContentVersion[];
  workflowStages: WorkflowStage[];
  savedViews: SavedView[];

  addTopicBatch: (batch: TopicBatch) => void;
  updateTopicBatch: (id: string, patch: Partial<TopicBatch>) => void;
  archiveTopicBatch: (id: string) => void;
  getTopicBatchById: (id: string) => TopicBatch | undefined;
  getTopicBatchesByBrand: (brandId: string) => TopicBatch[];

  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, patch: Partial<Topic>) => void;
  removeTopic: (id: string) => void;
  getTopicsByBatch: (batchId: string) => Topic[];

  addIdea: (idea: Idea) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  archiveIdea: (id: string) => void;
  restoreIdea: (id: string) => void;
  removeIdea: (id: string) => void;
  getIdeaById: (id: string) => Idea | undefined;
  getIdeasByBrand: (brandId: string) => Idea[];

  addContentVersion: (version: ContentVersion) => void;
  updateContentVersion: (id: string, next: ContentVersion) => void;
  removeContentVersion: (id: string) => void;
  getContentVersionsByIdea: (ideaId: string) => ContentVersion[];
  setActiveContentVersion: (ideaId: string, versionId: string) => void;

  addWorkflowStage: (stage: WorkflowStage) => void;
  updateWorkflowStage: (id: string, patch: Partial<WorkflowStage>) => void;
  removeWorkflowStage: (id: string) => void;
  getWorkflowStagesByBrand: (brandId: string) => WorkflowStage[];
  reorderWorkflowStages: (orderedIds: string[]) => void;

  addSavedView: (view: SavedView) => void;
  updateSavedView: (id: string, patch: Partial<SavedView>) => void;
  removeSavedView: (id: string) => void;
  getSavedViewById: (id: string) => SavedView | undefined;
  getSavedViewsByBrand: (brandId: string) => SavedView[];
}

const ContentWorkspaceContext = createContext<ContentWorkspaceValue | null>(null);

export function ContentWorkspaceProvider({ children }: { children: ReactNode }) {
  const [topicBatches, setTopicBatches] = useState<TopicBatch[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [contentVersions, setContentVersions] = useState<ContentVersion[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const value = useMemo<ContentWorkspaceValue>(
    () => ({
      topicBatches,
      topics,
      ideas,
      contentVersions,
      workflowStages,
      savedViews,

      addTopicBatch: (batch) => setTopicBatches((prev) => [...prev, batch]),
      updateTopicBatch: (id, patch) =>
        setTopicBatches((prev) => prev.map((batch) => (batch.id === id ? { ...batch, ...patch } : batch))),
      archiveTopicBatch: (id) =>
        setTopicBatches((prev) =>
          prev.map((batch) =>
            batch.id === id ? { ...batch, status: "archived", updatedAt: new Date().toISOString() } : batch
          )
        ),
      getTopicBatchById: (id) => topicBatches.find((batch) => batch.id === id),
      getTopicBatchesByBrand: (brandId) => topicBatches.filter((batch) => batch.brandId === brandId),

      addTopic: (topic) => setTopics((prev) => [...prev, topic]),
      updateTopic: (id, patch) =>
        setTopics((prev) => prev.map((topic) => (topic.id === id ? { ...topic, ...patch } : topic))),
      removeTopic: (id) => setTopics((prev) => prev.filter((topic) => topic.id !== id)),
      getTopicsByBatch: (batchId) => topics.filter((topic) => topic.batchId === batchId),

      addIdea: (idea) => setIdeas((prev) => [...prev, idea]),
      updateIdea: (id, patch) =>
        setIdeas((prev) =>
          prev.map((idea) => (idea.id === id ? { ...idea, ...patch, updatedAt: new Date().toISOString() } : idea))
        ),
      archiveIdea: (id) =>
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === id ? { ...idea, status: "archived", updatedAt: new Date().toISOString() } : idea
          )
        ),
      restoreIdea: (id) =>
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === id ? { ...idea, status: "idea", updatedAt: new Date().toISOString() } : idea
          )
        ),
      removeIdea: (id) => {
        setIdeas((prev) => prev.filter((idea) => idea.id !== id));
        setContentVersions((prev) => prev.filter((version) => version.ideaId !== id));
      },
      getIdeaById: (id) => ideas.find((idea) => idea.id === id),
      getIdeasByBrand: (brandId) => ideas.filter((idea) => idea.brandId === brandId),

      addContentVersion: (version) => setContentVersions((prev) => [...prev, version]),
      updateContentVersion: (id, next) =>
        setContentVersions((prev) => prev.map((version) => (version.id === id ? next : version))),
      removeContentVersion: (id) =>
        setContentVersions((prev) => {
          const removed = prev.find((version) => version.id === id);
          const remaining = prev.filter((version) => version.id !== id);
          if (!removed?.isCurrent) return remaining;
          const siblings = remaining
            .filter((version) => version.ideaId === removed.ideaId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (siblings.length === 0) return remaining;
          const promotedId = siblings[0].id;
          return remaining.map((version) =>
            version.id === promotedId ? { ...version, isCurrent: true } : version
          );
        }),
      getContentVersionsByIdea: (ideaId) => contentVersions.filter((version) => version.ideaId === ideaId),
      setActiveContentVersion: (ideaId, versionId) =>
        setContentVersions((prev) =>
          prev.map((version) =>
            version.ideaId === ideaId ? { ...version, isCurrent: version.id === versionId } : version
          )
        ),

      addWorkflowStage: (stage) => setWorkflowStages((prev) => [...prev, stage]),
      updateWorkflowStage: (id, patch) =>
        setWorkflowStages((prev) => prev.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage))),
      removeWorkflowStage: (id) => {
        setWorkflowStages((prev) => prev.filter((stage) => stage.id !== id));
        setIdeas((prev) =>
          prev.map((idea) => (idea.workflowStageId === id ? { ...idea, workflowStageId: undefined } : idea))
        );
      },
      getWorkflowStagesByBrand: (brandId) =>
        workflowStages.filter((stage) => stage.brandId === brandId),
      reorderWorkflowStages: (orderedIds) =>
        setWorkflowStages((prev) =>
          prev.map((stage) => {
            const index = orderedIds.indexOf(stage.id);
            return index === -1 ? stage : { ...stage, order: index };
          })
        ),

      addSavedView: (view) => setSavedViews((prev) => [...prev, view]),
      updateSavedView: (id, patch) =>
        setSavedViews((prev) => prev.map((view) => (view.id === id ? { ...view, ...patch } : view))),
      removeSavedView: (id) => setSavedViews((prev) => prev.filter((view) => view.id !== id)),
      getSavedViewById: (id) => savedViews.find((view) => view.id === id),
      getSavedViewsByBrand: (brandId) => savedViews.filter((view) => view.brandId === brandId),
    }),
    [topicBatches, topics, ideas, contentVersions, workflowStages, savedViews]
  );

  return <ContentWorkspaceContext.Provider value={value}>{children}</ContentWorkspaceContext.Provider>;
}

export function useContentWorkspace() {
  const context = useContext(ContentWorkspaceContext);
  if (!context) {
    throw new Error("useContentWorkspace must be used within a ContentWorkspaceProvider");
  }
  return context;
}
