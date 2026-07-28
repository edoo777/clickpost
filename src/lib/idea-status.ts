import type { IdeaStatus } from "@/types/idea";
import type { ContentPriority } from "@/types/publication";

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  idea: "Idée",
  to_develop: "À développer",
  reflecting: "En réflexion",
  plan_ready: "Plan préparé",
  drafting: "Rédaction en cours",
  content_generated: "Contenu généré",
  draft: "Brouillon",
  in_review: "En révision",
  approved: "Approuvé",
  ready_to_schedule: "Prêt à planifier",
  scheduled: "Planifié",
  published: "Publié",
  blocked: "Bloqué",
  needs_changes: "À corriger",
  failed: "Échec",
  archived: "Archivé",
};

export const IDEA_STATUS_STYLE: Record<IdeaStatus, string> = {
  idea: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  to_develop: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  reflecting: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  plan_ready: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  drafting: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  content_generated: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_review: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  ready_to_schedule: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  scheduled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  published: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  blocked: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  needs_changes: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  archived: "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
};

export const PRIORITY_LABEL: Record<ContentPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

export const IDEA_STATUS_ORDER: IdeaStatus[] = [
  "idea",
  "to_develop",
  "reflecting",
  "plan_ready",
  "drafting",
  "content_generated",
  "draft",
  "in_review",
  "approved",
  "ready_to_schedule",
  "scheduled",
  "published",
  "blocked",
  "needs_changes",
  "failed",
  "archived",
];

export const IDEA_TERMINAL_STATUSES: IdeaStatus[] = ["published", "archived"];

export const IDEA_ACTIVE_STATUSES: IdeaStatus[] = IDEA_STATUS_ORDER.filter(
  (status) => !IDEA_TERMINAL_STATUSES.includes(status)
);

export function getIdeaStatusLabel(status: IdeaStatus): string {
  return IDEA_STATUS_LABEL[status];
}

export function isIdeaTerminalStatus(status: IdeaStatus): boolean {
  return IDEA_TERMINAL_STATUSES.includes(status);
}

export function isIdeaActiveStatus(status: IdeaStatus): boolean {
  return IDEA_ACTIVE_STATUSES.includes(status);
}
