import type { NoteQuickActionKind, QuickActionKind } from "@/lib/ai/quick-actions";
import type { SocialPlatform } from "@/types/dashboard";

export interface QuickActionPromptInput {
  action: QuickActionKind;
  title: string;
  description?: string;
  brandTone?: string;
  targetPlatform?: SocialPlatform;
}

export interface QuickActionPrompt {
  system: string;
  user: string;
}

const ACTION_INSTRUCTION: Record<QuickActionKind, string> = {
  clarify: "Clarifie et reformule la description de cette idée pour qu'elle soit plus claire et plus facile à comprendre, sans changer son sens ni ajouter d'information nouvelle.",
  improve_title: "Propose un titre amélioré, plus clair et plus accrocheur, pour cette idée — un seul titre, court (une phrase maximum).",
  three_angles: "Propose exactement trois angles de traitement différents et distincts pour développer cette idée en contenu.",
  generate_hook: "Génère une accroche (première phrase percutante) pour développer cette idée en publication.",
  create_plan: "Propose un plan court (3 à 5 points, une ligne chacun) pour structurer le développement de cette idée.",
  adapt_platform: "Adapte la description de cette idée aux usages et au format habituels de la plateforme indiquée, sans changer le sujet.",
  add_cta: "Propose un appel à l'action (CTA) court et pertinent pour cette idée.",
  shorten: "Raccourcis la description de cette idée en gardant uniquement l'essentiel.",
  apply_brand_tone: "Reformule la description de cette idée selon le ton de marque indiqué, sans changer le sujet ni les faits.",
};

/**
 * Construit un prompt court et structuré pour une seule action ciblée sur un seul champ d'une
 * idée — jamais le profil complet de la marque, jamais l'historique de conversation. Réutilise
 * uniquement le client Anthropic serveur existant (voir la route associée) ; aucun second moteur
 * de génération n'est créé ici.
 */
export function buildQuickActionPrompt(input: QuickActionPromptInput): QuickActionPrompt {
  const isList = input.action === "three_angles";
  const system = [
    "Tu es un assistant éditorial francophone. Tu reçois une idée de publication (titre et, le cas",
    "échéant, une description courte) et tu dois exécuter UNE SEULE action ciblée dessus, sans",
    "rien inventer d'autre et sans changer le sujet de l'idée.",
    ACTION_INSTRUCTION[input.action],
    isList
      ? 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["angle 1","angle 2","angle 3"]} — exactement trois éléments.'
      : 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["résultat"]} — un seul élément.',
  ].join("\n");

  const userLines = [
    `Titre : ${input.title}`,
    input.description ? `Description actuelle : ${input.description}` : null,
    input.action === "adapt_platform" && input.targetPlatform ? `Plateforme cible : ${input.targetPlatform}` : null,
    input.action === "apply_brand_tone" && input.brandTone ? `Ton de marque à respecter : ${input.brandTone}` : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}

export interface NoteQuickActionPromptInput {
  action: NoteQuickActionKind;
  title?: string;
  content: string;
  brandTone?: string;
}

const NOTE_ACTION_INSTRUCTION: Record<NoteQuickActionKind, string> = {
  note_clarify: "Clarifie et reformule ce texte pour qu'il soit plus clair et plus facile à lire, sans changer son sens ni ajouter d'information nouvelle.",
  note_structure: "Structure cette réflexion libre en points ou sections logiques, sans changer le fond ni ajouter d'idées nouvelles.",
  note_summarize: "Résume ce texte en gardant uniquement les points essentiels.",
  note_expand: "Développe cette idée avec davantage de détails et d'exemples, en restant fidèle au sujet initial.",
  note_three_angles: "Propose exactement trois angles de traitement différents et distincts pour développer ce contenu en publication.",
  note_plan: "Transforme ce texte en un plan court (3 à 5 points, une ligne chacun) pour structurer une publication.",
  note_hook: "Génère une accroche (première phrase percutante) à partir de ce texte, pour développer une publication.",
  note_reformulate: "Reformule ce texte avec d'autres mots, sans changer son sens.",
  note_correct: "Corrige les fautes d'orthographe, de grammaire et de ponctuation de ce texte, sans changer son style ni son contenu.",
  note_brand_tone: "Reformule ce texte selon le ton de marque indiqué, sans changer le sujet ni les faits.",
  note_to_publication: "Transforme ce texte en une ébauche de publication (accroche, corps, appel à l'action), prête à être développée dans l'Atelier.",
};

/**
 * Prompt pour les actions IA rapides de la vue Notes — opère sur un contenu long (note entière
 * ou sélection), jamais sur un champ structuré unique. Même contrat de réponse JSON que
 * buildQuickActionPrompt, pour rester analysable par la même route serveur.
 */
export function buildNoteQuickActionPrompt(input: NoteQuickActionPromptInput): QuickActionPrompt {
  const isList = input.action === "note_three_angles";
  const system = [
    "Tu es un assistant éditorial francophone. Tu reçois un texte libre écrit par l'utilisateur",
    "(éventuellement précédé d'un titre) et tu dois exécuter UNE SEULE action ciblée dessus, sans",
    "rien inventer d'autre et sans changer le sujet.",
    NOTE_ACTION_INSTRUCTION[input.action],
    isList
      ? 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["angle 1","angle 2","angle 3"]} — exactement trois éléments.'
      : 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["résultat"]} — un seul élément.',
  ].join("\n");

  const userLines = [
    input.title ? `Titre : ${input.title}` : null,
    `Texte : ${input.content}`,
    input.action === "note_brand_tone" && input.brandTone ? `Ton de marque à respecter : ${input.brandTone}` : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}
