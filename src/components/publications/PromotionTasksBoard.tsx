"use client";

import { useState } from "react";
import { platformIcons } from "@/components/icons";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import {
  DEFAULT_PROMOTION_TASK_FILTERS,
  PROMOTION_STATUS_STYLE,
  PROMOTION_TASK_ORDER,
  getAllPromotionTasks,
  isTaskDueToday,
  isTaskOverdue,
  updateTaskInList,
  usePromotionStatusLabel,
  usePromotionTaskLabel,
  type PromotionTaskFilters,
} from "@/lib/promotion";
import { usePostsSession } from "@/lib/posts-store";
import { useTeamSession } from "@/lib/team-store";
import type { Publication } from "@/types/publication";
import type { PromotionTaskStatus } from "@/types/promotion";

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

interface PromotionTasksBoardProps {
  publications: Publication[];
  onOpen: (id: string) => void;
}

/**
 * Vue transversale des tâches de promotion — nouvel onglet du sélecteur de vues des publications
 * existant, jamais une page ou un système séparé. N'affiche que les publications qui ont déjà une
 * checklist (donc déjà réellement publiées).
 */
export function PromotionTasksBoard({ publications, onOpen }: PromotionTasksBoardProps) {
  const t = useTranslations();
  const { updatePost } = usePostsSession();
  const { brands } = useBrandsSession();
  const { members } = useTeamSession();
  const PROMOTION_STATUS_LABEL = usePromotionStatusLabel();
  const PROMOTION_TASK_LABEL = usePromotionTaskLabel();
  const [filters, setFilters] = useState<PromotionTaskFilters>(DEFAULT_PROMOTION_TASK_FILTERS);

  const rows = getAllPromotionTasks(publications, filters);

  function handleUpdateStatus(publication: Publication, taskId: string, status: PromotionTaskStatus) {
    const updated: Publication = {
      ...publication,
      promotionTasks: updateTaskInList(publication.promotionTasks ?? [], taskId, { status }),
    };
    updatePost(updated.id, updated);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as PromotionTaskFilters["status"] })} className={FIELD_CLASS}>
          <option value="all">{t("publications.promotion.allStatuses")}</option>
          {(["todo", "in_progress", "done", "skipped"] as PromotionTaskStatus[]).map((status) => (
            <option key={status} value={status}>
              {PROMOTION_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value as PromotionTaskFilters["type"] })} className={FIELD_CLASS}>
          <option value="all">{t("publications.promotion.allActions")}</option>
          {PROMOTION_TASK_ORDER.map((type) => (
            <option key={type} value={type}>
              {PROMOTION_TASK_LABEL[type]}
            </option>
          ))}
        </select>
        <select value={filters.owner} onChange={(event) => setFilters({ ...filters, owner: event.target.value })} className={FIELD_CLASS}>
          <option value="all">{t("publications.promotion.allOwners")}</option>
          {members.map((member) => (
            <option key={member.id} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
        <select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })} className={FIELD_CLASS}>
          <option value="all">{t("dashboard.allBrands")}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          {t("publications.promotion.emptyTasks")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface ">
          {rows.map(({ publication, task }) => {
            const Icon = platformIcons[publication.platform];
            const overdue = isTaskOverdue(task);
            const dueToday = isTaskDueToday(task);
            return (
              <li key={task.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ">
                  <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <button type="button" onClick={() => onOpen(publication.id)} className="truncate text-left text-sm font-medium text-foreground hover:underline ">
                    {PROMOTION_TASK_LABEL[task.type]} — {publication.excerpt || t("publications.card.untitled")}
                  </button>
                  <span className="truncate text-xs text-muted-foreground ">
                    {publication.brand} · {task.owner || t("publications.card.unassigned")}
                    {task.dueDate
                      ? ` · ${t("publications.promotion.dueDatePrefix", { date: dateFormatter.format(new Date(`${task.dueDate}T00:00:00`)) })}`
                      : ""}
                  </span>
                </div>
                {overdue && (
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    {t("publications.promotion.overdue")}
                  </span>
                )}
                {!overdue && dueToday && (
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {t("publications.promotion.dueToday")}
                  </span>
                )}
                <select
                  value={task.status}
                  onChange={(event) => handleUpdateStatus(publication, task.id, event.target.value as PromotionTaskStatus)}
                  className={`shrink-0 ${FIELD_CLASS} ${PROMOTION_STATUS_STYLE[task.status]}`}
                >
                  {(["todo", "in_progress", "done", "skipped"] as PromotionTaskStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {PROMOTION_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
