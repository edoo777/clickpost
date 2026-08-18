import { useMemo } from "react";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import type { PromotionTask, PromotionTaskStatus, PromotionTaskType } from "@/types/promotion";
import type { Publication } from "@/types/publication";

/** Ordre d'affichage fixe — correspond exactement à la liste du cahier des charges, la
 * promotion payante restant explicitement facultative. */
export const PROMOTION_TASK_ORDER: PromotionTaskType[] = [
  "repost_story",
  "share_community",
  "reply_comments",
  "partner_mention",
  "team_share_request",
  "recycle_format",
  "follow_up",
  "paid_boost",
];

export const PROMOTION_TASK_LABEL: Record<PromotionTaskType, string> = {
  repost_story: "Repartager en story",
  share_community: "Diffuser dans une communauté",
  reply_comments: "Répondre aux premiers commentaires",
  partner_mention: "Mentionner ou collaborer avec un partenaire",
  team_share_request: "Demander à l'équipe de partager",
  recycle_format: "Recycler dans un autre format",
  follow_up: "Relancer à une date ultérieure",
  paid_boost: "Promotion payante (facultative)",
};

export const PROMOTION_TASK_OPTIONAL: Set<PromotionTaskType> = new Set(["paid_boost"]);

export const PROMOTION_STATUS_LABEL: Record<PromotionTaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
  skipped: "Ignorée",
};

export const PROMOTION_STATUS_STYLE: Record<PromotionTaskStatus, string> = {
  todo: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  skipped: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-500",
};

const PROMOTION_TASK_LABEL_KEY: Record<PromotionTaskType, TranslationKey> = {
  repost_story: "status.promotionTask.repost_story",
  share_community: "status.promotionTask.share_community",
  reply_comments: "status.promotionTask.reply_comments",
  partner_mention: "status.promotionTask.partner_mention",
  team_share_request: "status.promotionTask.team_share_request",
  recycle_format: "status.promotionTask.recycle_format",
  follow_up: "status.promotionTask.follow_up",
  paid_boost: "status.promotionTask.paid_boost",
};

const PROMOTION_STATUS_LABEL_KEY: Record<PromotionTaskStatus, TranslationKey> = {
  todo: "status.promotion.todo",
  in_progress: "status.promotion.in_progress",
  done: "status.promotion.done",
  skipped: "status.promotion.skipped",
};

/** Version traduite de `PROMOTION_TASK_LABEL`, réservée aux composants React. */
export function usePromotionTaskLabel(): Record<PromotionTaskType, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(PROMOTION_TASK_LABEL_KEY) as [PromotionTaskType, TranslationKey][];
    return Object.fromEntries(entries.map(([type, key]) => [type, t(key)])) as Record<PromotionTaskType, string>;
  }, [t]);
}

/** Version traduite de `PROMOTION_STATUS_LABEL` — voir le commentaire de `usePromotionTaskLabel`. */
export function usePromotionStatusLabel(): Record<PromotionTaskStatus, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(PROMOTION_STATUS_LABEL_KEY) as [PromotionTaskStatus, TranslationKey][];
    return Object.fromEntries(entries.map(([status, key]) => [status, t(key)])) as Record<PromotionTaskStatus, string>;
  }, [t]);
}

/** Générée une seule fois, à la première publication réelle d'un contenu (voir
 * PublicationView.handleMarkPublished) — jamais régénérée ni dupliquée si déjà présente. */
export function buildDefaultPromotionTasks(defaultOwner: string): PromotionTask[] {
  const now = new Date().toISOString();
  return PROMOTION_TASK_ORDER.map((type) => ({
    id: crypto.randomUUID(),
    type,
    owner: defaultOwner,
    status: "todo" as PromotionTaskStatus,
    notes: "",
    createdAt: now,
    updatedAt: now,
  }));
}

export interface PromotionProgress {
  done: number;
  total: number;
  percent: number;
}

/** "Ignorée" compte comme une tâche traitée pour la progression (une décision explicite de ne
 * pas faire une action reste une décision prise, pas une tâche encore en attente). */
export function getPromotionProgress(tasks: PromotionTask[]): PromotionProgress {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done" || task.status === "skipped").length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function isTaskOverdue(task: PromotionTask, today = new Date()): boolean {
  if (!task.dueDate) return false;
  if (task.status === "done" || task.status === "skipped") return false;
  return task.dueDate < today.toISOString().slice(0, 10);
}

export function isTaskDueToday(task: PromotionTask, today = new Date()): boolean {
  if (!task.dueDate) return false;
  if (task.status === "done" || task.status === "skipped") return false;
  return task.dueDate === today.toISOString().slice(0, 10);
}

export function updateTaskInList(tasks: PromotionTask[], taskId: string, patch: Partial<PromotionTask>): PromotionTask[] {
  const now = new Date().toISOString();
  return tasks.map((task) => {
    if (task.id !== taskId) return task;
    const updated: PromotionTask = { ...task, ...patch, updatedAt: now };
    if (patch.status === "done" && task.status !== "done") updated.completedAt = now;
    if (patch.status && patch.status !== "done") updated.completedAt = undefined;
    return updated;
  });
}

export interface PromotionTaskFilters {
  status: PromotionTaskStatus | "all";
  type: PromotionTaskType | "all";
  owner: string | "all";
  brand: string | "all";
}

export const DEFAULT_PROMOTION_TASK_FILTERS: PromotionTaskFilters = {
  status: "all",
  type: "all",
  owner: "all",
  brand: "all",
};

export interface PromotionTaskRow {
  publication: Publication;
  task: PromotionTask;
}

/** Vue transversale des tâches de promotion, toutes publications confondues — jamais un second
 * système : dérivée à la volée de Publication.promotionTasks, jamais stockée séparément. */
export function getAllPromotionTasks(publications: Publication[], filters: PromotionTaskFilters): PromotionTaskRow[] {
  const rows: PromotionTaskRow[] = [];
  for (const publication of publications) {
    if (filters.brand !== "all" && publication.brand !== filters.brand) continue;
    for (const task of publication.promotionTasks ?? []) {
      if (filters.status !== "all" && task.status !== filters.status) continue;
      if (filters.type !== "all" && task.type !== filters.type) continue;
      if (filters.owner !== "all" && task.owner !== filters.owner) continue;
      rows.push({ publication, task });
    }
  }
  return rows.sort((a, b) => {
    const aDate = a.task.dueDate ?? "9999-99-99";
    const bDate = b.task.dueDate ?? "9999-99-99";
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
  });
}
