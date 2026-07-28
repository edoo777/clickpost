"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { KanbanCard } from "@/components/ideas-bank/KanbanCard";
import { KanbanColumnsManager } from "@/components/ideas-bank/KanbanColumnsManager";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { mapIdeaStatusToPublicationStatus, SYNC_ACTOR_NAME } from "@/lib/idea-publication-sync";
import { usePostsSession } from "@/lib/posts-store";
import { buildDefaultWorkflowStages } from "@/lib/workflow-stages";
import type { Idea } from "@/types/idea";
import type { WorkflowStage } from "@/types/workflow-stage";

interface IdeasBankKanbanProps {
  brandId: string;
  ideas: Idea[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export function IdeasBankKanban({ brandId, ideas, selectedIds, onToggleSelect, onOpen }: IdeasBankKanbanProps) {
  const { addWorkflowStage, updateIdea, getWorkflowStagesByBrand } = useContentWorkspace();
  const { posts, changeStatus } = usePostsSession();
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const bootstrappedBrandIds = useRef<Set<string>>(new Set());

  const stages = useMemo(
    () => getWorkflowStagesByBrand(brandId).slice().sort((a, b) => a.order - b.order),
    [brandId, getWorkflowStagesByBrand]
  );

  useEffect(() => {
    if (stages.length > 0) return;
    if (bootstrappedBrandIds.current.has(brandId)) return;
    bootstrappedBrandIds.current.add(brandId);
    buildDefaultWorkflowStages(brandId).forEach((stage) => addWorkflowStage(stage));
  }, [brandId, stages.length, addWorkflowStage]);

  const stageIds = useMemo(() => new Set(stages.map((stage) => stage.id)), [stages]);
  const unassigned = ideas.filter((idea) => !idea.workflowStageId || !stageIds.has(idea.workflowStageId));

  function handleDrop(event: DragEvent<HTMLDivElement>, stage: WorkflowStage) {
    event.preventDefault();
    const ideaId = event.dataTransfer.getData("text/plain");
    setDragOverStageId(null);
    if (!ideaId) return;
    const newStatus = stage.systemStatus as Idea["status"];
    updateIdea(ideaId, { workflowStageId: stage.id, status: newStatus });

    const idea = ideas.find((candidate) => candidate.id === ideaId);
    if (!idea?.publicationId) return;
    const publication = posts.find((post) => post.id === idea.publicationId);
    if (!publication) return;
    const mapped = mapIdeaStatusToPublicationStatus(newStatus);
    if (mapped && mapped !== publication.status) {
      changeStatus(publication.id, mapped, SYNC_ACTOR_NAME);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {ideas.length} idée{ideas.length > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => setIsManagerOpen(true)}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Gérer les colonnes
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageIdeas = ideas.filter((idea) => idea.workflowStageId === stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverStageId(stage.id);
              }}
              onDragLeave={() => setDragOverStageId((current) => (current === stage.id ? null : current))}
              onDrop={(event) => handleDrop(event, stage)}
              className={`flex w-72 flex-shrink-0 flex-col gap-3 rounded-xl border p-3 ${
                dragOverStageId === stage.id
                  ? "border-zinc-950 dark:border-zinc-50"
                  : "border-black/[.08] dark:border-white/[.08]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stage.color}`}>{stage.name}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">{stageIdeas.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {stageIdeas.map((idea) => (
                  <KanbanCard
                    key={idea.id}
                    idea={idea}
                    isSelected={selectedIds.has(idea.id)}
                    onToggleSelect={() => onToggleSelect(idea.id)}
                    onOpen={() => onOpen(idea.id)}
                  />
                ))}
                {stageIdeas.length === 0 && (
                  <p className="rounded-lg border border-dashed border-black/[.1] px-2 py-4 text-center text-xs text-zinc-400 dark:border-white/[.1] dark:text-zinc-600">
                    Aucune idée
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <div
          onDragOver={(event) => event.preventDefault()}
          className="flex w-72 flex-shrink-0 flex-col gap-3 rounded-xl border border-dashed border-black/[.12] p-3 dark:border-white/[.12]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              Sans colonne
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">{unassigned.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {unassigned.map((idea) => (
              <KanbanCard
                key={idea.id}
                idea={idea}
                isSelected={selectedIds.has(idea.id)}
                onToggleSelect={() => onToggleSelect(idea.id)}
                onOpen={() => onOpen(idea.id)}
              />
            ))}
            {unassigned.length === 0 && (
              <p className="rounded-lg border border-dashed border-black/[.1] px-2 py-4 text-center text-xs text-zinc-400 dark:border-white/[.1] dark:text-zinc-600">
                Aucune idée
              </p>
            )}
          </div>
        </div>
      </div>

      {isManagerOpen && (
        <KanbanColumnsManager brandId={brandId} stages={stages} onClose={() => setIsManagerOpen(false)} />
      )}
    </div>
  );
}
