import type { IdeaStatus } from "@/types/idea";
import type { WorkflowStage } from "@/types/workflow-stage";

export const STAGE_COLOR_OPTIONS: string[] = [
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
];

interface DefaultStageTemplate {
  name: string;
  color: string;
  systemStatus: IdeaStatus;
  isDefault: boolean;
  isTerminal: boolean;
}

const DEFAULT_STAGE_TEMPLATES: DefaultStageTemplate[] = [
  { name: "Idée", color: STAGE_COLOR_OPTIONS[0], systemStatus: "idea", isDefault: true, isTerminal: false },
  { name: "En préparation", color: STAGE_COLOR_OPTIONS[1], systemStatus: "drafting", isDefault: false, isTerminal: false },
  { name: "En révision", color: STAGE_COLOR_OPTIONS[6], systemStatus: "in_review", isDefault: false, isTerminal: false },
  { name: "Approuvé", color: STAGE_COLOR_OPTIONS[4], systemStatus: "approved", isDefault: false, isTerminal: false },
  { name: "Planifié", color: STAGE_COLOR_OPTIONS[3], systemStatus: "scheduled", isDefault: false, isTerminal: false },
  { name: "Publié", color: STAGE_COLOR_OPTIONS[5], systemStatus: "published", isDefault: false, isTerminal: true },
];

/**
 * Colonnes par défaut créées une seule fois pour une marque n'ayant encore aucun `WorkflowStage`
 * — immédiatement personnalisables ensuite (renommer/recolorer/réordonner/supprimer), à l'image
 * des colonnes de démarrage d'un tableau Notion.
 */
export function buildDefaultWorkflowStages(brandId: string): WorkflowStage[] {
  const now = new Date().toISOString();
  return DEFAULT_STAGE_TEMPLATES.map((template, index) => ({
    id: crypto.randomUUID(),
    brandId,
    name: template.name,
    color: template.color,
    order: index,
    systemStatus: template.systemStatus,
    active: true,
    isDefault: template.isDefault,
    isTerminal: template.isTerminal,
    createdAt: now,
    updatedAt: now,
  }));
}

export function nextWorkflowStageOrder(stages: WorkflowStage[], brandId: string): number {
  const brandStages = stages.filter((stage) => stage.brandId === brandId);
  if (brandStages.length === 0) return 0;
  return Math.max(...brandStages.map((stage) => stage.order)) + 1;
}
