"use client";

import { useContentWorkspace } from "@/lib/content-workspace-store";
import { IDEA_STATUS_LABEL, IDEA_STATUS_ORDER } from "@/lib/idea-status";
import { STAGE_COLOR_OPTIONS, nextWorkflowStageOrder } from "@/lib/workflow-stages";
import type { IdeaStatus } from "@/types/idea";
import type { WorkflowStage } from "@/types/workflow-stage";

interface KanbanColumnsManagerProps {
  brandId: string;
  stages: WorkflowStage[];
  onClose: () => void;
}

export function KanbanColumnsManager({ brandId, stages, onClose }: KanbanColumnsManagerProps) {
  const { workflowStages, addWorkflowStage, updateWorkflowStage, removeWorkflowStage, reorderWorkflowStages } =
    useContentWorkspace();
  const sorted = [...stages].sort((a, b) => a.order - b.order);

  function handleMove(id: string, direction: -1 | 1) {
    const index = sorted.findIndex((stage) => stage.id === id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderWorkflowStages(reordered.map((stage) => stage.id));
  }

  function handleAdd() {
    const now = new Date().toISOString();
    addWorkflowStage({
      id: crypto.randomUUID(),
      brandId,
      name: "Nouvelle colonne",
      color: STAGE_COLOR_OPTIONS[sorted.length % STAGE_COLOR_OPTIONS.length],
      order: nextWorkflowStageOrder(workflowStages, brandId),
      systemStatus: "idea",
      active: true,
      isDefault: false,
      isTerminal: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  function handleDelete(stage: WorkflowStage) {
    if (
      !window.confirm(
        `Supprimer la colonne « ${stage.name} » ? Les idées qu'elle contient repasseront en « Sans colonne ».`
      )
    )
      return;
    removeWorkflowStage(stage.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Gérer les colonnes</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Fermer
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {sorted.map((stage, index) => (
            <div
              key={stage.id}
              className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-3 dark:border-white/[.08]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={stage.name}
                  onChange={(event) => updateWorkflowStage(stage.id, { name: event.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-black/[.08] bg-white px-2.5 py-1 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => handleMove(stage.id, -1)}
                  disabled={index === 0}
                  className="rounded-lg border border-black/[.08] px-2 py-1 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[.08] dark:text-zinc-400"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(stage.id, 1)}
                  disabled={index === sorted.length - 1}
                  className="rounded-lg border border-black/[.08] px-2 py-1 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[.08] dark:text-zinc-400"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(stage)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={stage.systemStatus}
                  onChange={(event) => updateWorkflowStage(stage.id, { systemStatus: event.target.value as IdeaStatus })}
                  className="rounded-lg border border-black/[.08] bg-white px-2.5 py-1 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {IDEA_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {IDEA_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  {STAGE_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateWorkflowStage(stage.id, { color })}
                      aria-label="Choisir cette couleur"
                      className={`h-6 w-6 rounded-full ${color} ${
                        stage.color === color ? "ring-2 ring-zinc-950 dark:ring-zinc-50" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-fit rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          + Ajouter une colonne
        </button>
      </div>
    </div>
  );
}
