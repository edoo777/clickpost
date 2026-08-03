"use client";

import { useState } from "react";
import {
  PROMOTION_STATUS_LABEL,
  PROMOTION_STATUS_STYLE,
  PROMOTION_TASK_LABEL,
  PROMOTION_TASK_OPTIONAL,
  PROMOTION_TASK_ORDER,
  getPromotionProgress,
  isTaskDueToday,
  isTaskOverdue,
} from "@/lib/promotion";
import type { TeamMember } from "@/types/team";
import type { PromotionTask, PromotionTaskStatus } from "@/types/promotion";

const INPUT_CLASS =
  "rounded-lg border border-border bg-surface px-2 py-1 text-xs text-zinc-700   dark:text-zinc-300";

interface PromotionChecklistProps {
  tasks: PromotionTask[];
  members: TeamMember[];
  onUpdateTask: (taskId: string, patch: Partial<PromotionTask>) => void;
}

/**
 * Checklist de promotion post-publication (Phase E) — jamais un CRM séparé : rattachée
 * directement à la publication (Publication.promotionTasks), rendue uniquement pour une
 * publication déjà réellement publiée. Huit tâches fixes, chacune éditable (responsable,
 * échéance, statut, notes) ; la progression est calculée, jamais stockée séparément.
 */
export function PromotionChecklist({ tasks, members, onUpdateTask }: PromotionChecklistProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const progress = getPromotionProgress(tasks);
  const orderedTasks = PROMOTION_TASK_ORDER.map((type) => tasks.find((task) => task.type === type)).filter(
    (task): task is PromotionTask => Boolean(task)
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground ">Promotion et diffusion</h2>
        <span className="text-xs font-medium text-muted-foreground ">
          {progress.done}/{progress.total} traitées ({progress.percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted ">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" style={{ width: `${progress.percent}%` }} />
      </div>

      <ul className="flex flex-col divide-y divide-border ">
        {orderedTasks.map((task) => {
          const overdue = isTaskOverdue(task);
          const dueToday = isTaskDueToday(task);
          const isExpanded = expandedId === task.id;
          return (
            <li key={task.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  className="flex items-center gap-2 text-left text-sm font-medium text-foreground hover:underline "
                >
                  {PROMOTION_TASK_LABEL[task.type]}
                  {PROMOTION_TASK_OPTIONAL.has(task.type) && (
                    <span className="text-xs font-normal text-muted-foreground ">(facultative)</span>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  {overdue && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      En retard
                    </span>
                  )}
                  {!overdue && dueToday && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      Aujourd&apos;hui
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PROMOTION_STATUS_STYLE[task.status]}`}>
                    {PROMOTION_STATUS_LABEL[task.status]}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted p-3 sm:grid-cols-2 ">
                  <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Responsable
                    <select
                      value={task.owner}
                      onChange={(event) => onUpdateTask(task.id, { owner: event.target.value })}
                      className={INPUT_CLASS}
                    >
                      <option value="">Non assigné</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Échéance
                    <input
                      type="date"
                      value={task.dueDate ?? ""}
                      onChange={(event) => onUpdateTask(task.id, { dueDate: event.target.value || undefined })}
                      className={INPUT_CLASS}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Statut
                    <select
                      value={task.status}
                      onChange={(event) => onUpdateTask(task.id, { status: event.target.value as PromotionTaskStatus })}
                      className={INPUT_CLASS}
                    >
                      {(["todo", "in_progress", "done", "skipped"] as PromotionTaskStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {PROMOTION_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:col-span-2">
                    Notes
                    <textarea
                      rows={2}
                      value={task.notes}
                      onChange={(event) => onUpdateTask(task.id, { notes: event.target.value })}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
