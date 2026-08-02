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

/**
 * Actions IA rapides de la vue Notes — opèrent sur un contenu long (note entière ou sélection
 * de texte dans l'éditeur), jamais sur un champ structuré unique comme les actions ci-dessus.
 * Même route serveur, même architecture Anthropic — un second lot d'actions, pas un second moteur.
 */
export type NoteQuickActionKind =
  | "note_clarify"
  | "note_structure"
  | "note_summarize"
  | "note_expand"
  | "note_three_angles"
  | "note_plan"
  | "note_hook"
  | "note_reformulate"
  | "note_correct"
  | "note_brand_tone"
  | "note_to_publication";

export interface NoteQuickActionDefinition {
  key: NoteQuickActionKind;
  label: string;
  isList: boolean;
  requiresBrandTone?: boolean;
}

export const NOTE_QUICK_ACTIONS: NoteQuickActionDefinition[] = [
  { key: "note_clarify", label: "Clarifier la note", isList: false },
  { key: "note_structure", label: "Structurer la réflexion", isList: false },
  { key: "note_summarize", label: "Résumer", isList: false },
  { key: "note_expand", label: "Développer l'idée", isList: false },
  { key: "note_three_angles", label: "Proposer trois angles", isList: true },
  { key: "note_plan", label: "Transformer en plan", isList: false },
  { key: "note_hook", label: "Générer une accroche", isList: false },
  { key: "note_reformulate", label: "Reformuler", isList: false },
  { key: "note_correct", label: "Corriger le texte", isList: false },
  { key: "note_brand_tone", label: "Adapter au ton de la marque", isList: false, requiresBrandTone: true },
  { key: "note_to_publication", label: "Transformer en publication", isList: false },
];

export const ALL_NOTE_QUICK_ACTION_KEYS: NoteQuickActionKind[] = NOTE_QUICK_ACTIONS.map((action) => action.key);

export function getNoteQuickAction(key: NoteQuickActionKind): NoteQuickActionDefinition {
  const found = NOTE_QUICK_ACTIONS.find((action) => action.key === key);
  if (!found) throw new Error(`Action IA rapide inconnue : ${key}`);
  return found;
}

export type AnyQuickActionKind = QuickActionKind | NoteQuickActionKind;

export interface NoteQuickActionRequestInput {
  action: NoteQuickActionKind;
  /** Titre de la note — contexte informatif facultatif, jamais le champ ciblé par l'action. */
  title?: string;
  /** Contenu sur lequel appliquer l'action : la note entière, ou uniquement le texte sélectionné
   * dans l'éditeur. Toujours du texte brut (jamais le JSON Tiptap envoyé au serveur). */
  content: string;
  brandTone?: string;
}
