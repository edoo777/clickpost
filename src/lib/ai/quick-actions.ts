import type { SocialPlatform } from "@/types/dashboard";

/**
 * Catalogue des actions IA rapides de la Banque d'idées — données pures (aucun import serveur),
 * partagées entre le client (menu, aperçu) et le serveur (prompt). Chaque action cible un seul
 * champ court de l'idée, jamais l'idée entière, pour rester une action ciblée plutôt qu'une
 * régénération complète (qui reste le rôle de l'Atelier).
 */
export type QuickActionKind =
  | "clarify"
  | "improve_title"
  | "three_angles"
  | "generate_hook"
  | "create_plan"
  | "adapt_platform"
  | "add_cta"
  | "shorten"
  | "apply_brand_tone";

export type QuickActionTargetField = "title" | "description" | "hook" | "contentPlan" | "cta" | "angle";

export interface QuickActionDefinition {
  key: QuickActionKind;
  label: string;
  targetField: QuickActionTargetField;
  /** true uniquement pour « Proposer trois angles » — le résultat est une liste à choisir,
   * jamais appliqué automatiquement en bloc. */
  isList: boolean;
  requiresPlatform?: boolean;
  requiresBrandTone?: boolean;
}

export const QUICK_ACTIONS: QuickActionDefinition[] = [
  { key: "clarify", label: "Clarifier", targetField: "description", isList: false },
  { key: "improve_title", label: "Améliorer le titre", targetField: "title", isList: false },
  { key: "three_angles", label: "Proposer trois angles", targetField: "angle", isList: true },
  { key: "generate_hook", label: "Générer une accroche", targetField: "hook", isList: false },
  { key: "create_plan", label: "Créer un plan", targetField: "contentPlan", isList: false },
  { key: "adapt_platform", label: "Adapter à une plateforme", targetField: "description", isList: false, requiresPlatform: true },
  { key: "add_cta", label: "Proposer un appel à l'action", targetField: "cta", isList: false },
  { key: "shorten", label: "Raccourcir", targetField: "description", isList: false },
  { key: "apply_brand_tone", label: "Reformuler selon le ton de la marque", targetField: "description", isList: false, requiresBrandTone: true },
];

export const QUICK_ACTION_TARGET_LABEL: Record<QuickActionTargetField, string> = {
  title: "Titre",
  description: "Description",
  hook: "Accroche",
  contentPlan: "Plan",
  cta: "Appel à l'action",
  angle: "Angle",
};

export const ALL_QUICK_ACTION_KEYS: QuickActionKind[] = QUICK_ACTIONS.map((action) => action.key);

export function getQuickAction(key: QuickActionKind): QuickActionDefinition {
  const found = QUICK_ACTIONS.find((action) => action.key === key);
  if (!found) throw new Error(`Action IA rapide inconnue : ${key}`);
  return found;
}

export interface QuickActionRequestInput {
  action: QuickActionKind;
  title: string;
  description?: string;
  brandTone?: string;
  targetPlatform?: SocialPlatform;
}
