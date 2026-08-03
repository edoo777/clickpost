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

export type AnyQuickActionKind = QuickActionKind | NoteQuickActionKind | PublicationQuickActionKind;

export interface NoteQuickActionRequestInput {
  action: NoteQuickActionKind;
  /** Titre de la note — contexte informatif facultatif, jamais le champ ciblé par l'action. */
  title?: string;
  /** Contenu sur lequel appliquer l'action : la note entière, ou uniquement le texte sélectionné
   * dans l'éditeur. Toujours du texte brut (jamais le JSON Tiptap envoyé au serveur). */
  content: string;
  brandTone?: string;
}

/**
 * Actions IA rapides de « Nouvelle publication » (mode Claude) — troisième catalogue, même route
 * serveur, même architecture. Chaque action cible un champ précis de la publication (texte, titre/
 * accroche, appel à l'action ou hashtags), jamais l'ensemble — la génération complète reste une
 * action distincte (/api/ia/publications/generate), pas une quick action.
 */
export type PublicationQuickActionKind =
  | "publication_improve"
  | "publication_shorten"
  | "publication_expand"
  | "publication_change_tone"
  | "publication_more_hooks"
  | "publication_improve_cta"
  | "publication_generate_hashtags"
  | "publication_correct";

export type PublicationQuickActionTargetField = "text" | "title" | "cta" | "hashtags";

export interface PublicationQuickActionDefinition {
  key: PublicationQuickActionKind;
  label: string;
  targetField: PublicationQuickActionTargetField;
  /** true pour les actions qui proposent plusieurs choix (accroches, hashtags) plutôt qu'un
   * remplacement direct — l'utilisateur choisit avant application, jamais une insertion en bloc. */
  isList: boolean;
  requiresTone?: boolean;
}

export const PUBLICATION_QUICK_ACTIONS: PublicationQuickActionDefinition[] = [
  { key: "publication_improve", label: "Améliorer", targetField: "text", isList: false },
  { key: "publication_shorten", label: "Raccourcir", targetField: "text", isList: false },
  { key: "publication_expand", label: "Développer", targetField: "text", isList: false },
  { key: "publication_change_tone", label: "Changer le ton", targetField: "text", isList: false, requiresTone: true },
  { key: "publication_more_hooks", label: "Générer d'autres accroches", targetField: "title", isList: true },
  { key: "publication_improve_cta", label: "Améliorer l'appel à l'action", targetField: "cta", isList: false },
  { key: "publication_generate_hashtags", label: "Générer les hashtags", targetField: "hashtags", isList: true },
  { key: "publication_correct", label: "Corriger l'orthographe", targetField: "text", isList: false },
];

export const ALL_PUBLICATION_QUICK_ACTION_KEYS: PublicationQuickActionKind[] = PUBLICATION_QUICK_ACTIONS.map((action) => action.key);

export function getPublicationQuickAction(key: PublicationQuickActionKind): PublicationQuickActionDefinition {
  const found = PUBLICATION_QUICK_ACTIONS.find((action) => action.key === key);
  if (!found) throw new Error(`Action IA rapide inconnue : ${key}`);
  return found;
}

export interface PublicationQuickActionRequestInput {
  action: PublicationQuickActionKind;
  /** Valeurs actuelles des champs de la publication — seuls ceux pertinents pour l'action sont
   * utilisés côté prompt, les autres ne servent que de contexte facultatif. */
  title?: string;
  text?: string;
  cta?: string;
  hashtags?: string[];
  tone?: string;
}
