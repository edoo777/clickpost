"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { getNextActor } from "@/lib/approval";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { STATUS_STYLE, useStatusLabel } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import { isTaskDueToday, isTaskOverdue, usePromotionTaskLabel } from "@/lib/promotion";
import { useTeamSession } from "@/lib/team-store";
import type { Publication } from "@/types/publication";
import type { PromotionTask } from "@/types/promotion";

const MAX_ITEMS = 4;
const ACTIONABLE_STATUSES = new Set(["in_production", "needs_changes", "in_review", "pending_client"]);

interface PublicationTaskItem {
  kind: "publication";
  publication: Publication;
  sortDate: string;
}

interface PromotionTaskItem {
  kind: "promotion";
  publication: Publication;
  task: PromotionTask;
  sortDate: string;
  overdue: boolean;
}

type TaskItem = PublicationTaskItem | PromotionTaskItem;

/** Rappel interne simple : rassemble dans une seule liste les publications qui attendent une
 * action de l'utilisateur courant ET ses tâches de promotion en retard ou dues aujourd'hui —
 * jamais un système de notification séparé, uniquement dérivé des données déjà existantes. */
export function MyTasksWidget() {
  const t = useTranslations();
  const { posts } = usePostsSession();
  const { members, currentUserId } = useTeamSession();
  const STATUS_LABEL = useStatusLabel();
  const PROMOTION_TASK_LABEL = usePromotionTaskLabel();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";

  const publicationItems: TaskItem[] = posts
    .filter((post) => ACTIONABLE_STATUSES.has(post.status) && getNextActor(post) === currentUserName)
    .map((publication) => ({ kind: "publication", publication, sortDate: publication.scheduledFor }));

  const promotionItems: TaskItem[] = posts.flatMap((publication) =>
    (publication.promotionTasks ?? [])
      .filter((task) => task.owner === currentUserName && (isTaskOverdue(task) || isTaskDueToday(task)))
      .map((task) => ({
        kind: "promotion" as const,
        publication,
        task,
        sortDate: task.dueDate ?? "",
        overdue: isTaskOverdue(task),
      }))
  );

  const myTasks = [...publicationItems, ...promotionItems]
    .sort((a, b) => (a.sortDate < b.sortDate ? -1 : a.sortDate > b.sortDate ? 1 : 0))
    .slice(0, MAX_ITEMS);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">{t("dashboard.myTasksTitle")}</h2>
        <span className="text-xs text-muted-foreground ">{currentUserName}</span>
      </div>
      {myTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground ">{t("dashboard.myTasksEmpty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
          {myTasks.map((item) => {
            const Icon = platformIcons[item.publication.platform];
            if (item.kind === "publication") {
              return (
                <li key={item.publication.id}>
                  <Link
                    href={`/publications/${item.publication.id}`}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                      <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-foreground ">
                        {item.publication.excerpt || t("dashboard.untitled")}
                      </span>
                      <span className="truncate text-xs text-muted-foreground ">{item.publication.brand}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[item.publication.status]}`}
                    >
                      {STATUS_LABEL[item.publication.status]}
                    </span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.task.id}>
                <Link
                  href={`/publications/${item.publication.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                    <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground ">
                      {PROMOTION_TASK_LABEL[item.task.type]}
                    </span>
                    <span className="truncate text-xs text-muted-foreground ">
                      {item.publication.excerpt || t("dashboard.untitled")}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.overdue
                        ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}
                  >
                    {item.overdue ? t("dashboard.myTasksOverdue") : t("dashboard.myTasksDueToday")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
