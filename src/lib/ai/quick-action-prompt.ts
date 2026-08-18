import type { NoteQuickActionKind, PublicationQuickActionKind, QuickActionKind } from "@/lib/ai/quick-actions";
import { buildLanguageInstruction } from "@/lib/ai/prompt-context";
import type { Locale } from "@/lib/i18n/locale";
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
export function buildQuickActionPrompt(input: QuickActionPromptInput, language: Locale): QuickActionPrompt {
  const isList = input.action === "three_angles";
  const system = [
    "Tu es un assistant éditorial. Tu reçois une idée de publication (titre et, le cas",
    "échéant, une description courte) et tu dois exécuter UNE SEULE action ciblée dessus, sans",
    "rien inventer d'autre et sans changer le sujet de l'idée.",
    buildLanguageInstruction(language),
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
export function buildNoteQuickActionPrompt(input: NoteQuickActionPromptInput, language: Locale): QuickActionPrompt {
  const isList = input.action === "note_three_angles";
  const system = [
    "Tu es un assistant éditorial. Tu reçois un texte libre écrit par l'utilisateur",
    "(éventuellement précédé d'un titre) et tu dois exécuter UNE SEULE action ciblée dessus, sans",
    "rien inventer d'autre et sans changer le sujet.",
    buildLanguageInstruction(language),
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

export interface PublicationQuickActionPromptInput {
  action: PublicationQuickActionKind;
  title?: string;
  text?: string;
  cta?: string;
  hashtags?: string[];
  tone?: string;
}

const PUBLICATION_ACTION_INSTRUCTION: Record<PublicationQuickActionKind, string> = {
  publication_improve: "Améliore le texte de cette publication (clarté, fluidité, impact), sans changer son sujet ni inventer de fait nouveau.",
  publication_shorten: "Raccourcis le texte de cette publication en gardant uniquement l'essentiel.",
  publication_expand: "Développe le texte de cette publication avec davantage de détails, en restant fidèle au sujet initial.",
  publication_change_tone: "Reformule le texte de cette publication selon le ton indiqué, sans changer le sujet ni les faits.",
  publication_more_hooks: "Propose exactement trois nouvelles accroches (titres courts et percutants) alternatives pour cette publication, distinctes les unes des autres et du titre actuel.",
  publication_improve_cta: "Propose un appel à l'action amélioré, court et percutant, cohérent avec le texte de la publication.",
  publication_generate_hashtags: "Propose entre cinq et huit hashtags pertinents pour cette publication, chacun commençant par #, sans espace.",
  publication_correct: "Corrige les fautes d'orthographe, de grammaire et de ponctuation du texte de cette publication, sans changer son style ni son contenu.",
};

/**
 * Prompt pour les actions IA rapides de « Nouvelle publication » (mode Claude) — troisième
 * catalogue, même contrat de réponse JSON {"items":[...]} que les deux précédents, pour rester
 * analysable par la même route serveur sans logique dupliquée.
 */
export function buildPublicationQuickActionPrompt(input: PublicationQuickActionPromptInput, language: Locale): QuickActionPrompt {
  const isList = input.action === "publication_more_hooks" || input.action === "publication_generate_hashtags";
  const system = [
    "Tu es un assistant éditorial pour les réseaux sociaux. Tu reçois les champs d'une",
    "publication en cours de rédaction et tu dois exécuter UNE SEULE action ciblée dessus, sans rien",
    "inventer d'autre et sans changer le sujet.",
    buildLanguageInstruction(language),
    PUBLICATION_ACTION_INSTRUCTION[input.action],
    input.action === "publication_more_hooks"
      ? 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["accroche 1","accroche 2","accroche 3"]} — exactement trois éléments.'
      : input.action === "publication_generate_hashtags"
        ? 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["#exemple1","#exemple2",...]} — entre cinq et huit éléments.'
        : 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["résultat"]} — un seul élément.',
  ].join("\n");

  const userLines = [
    input.title ? `Titre / accroche actuelle : ${input.title}` : null,
    input.text ? `Texte actuel : ${input.text}` : null,
    input.cta ? `Appel à l'action actuel : ${input.cta}` : null,
    input.hashtags && input.hashtags.length > 0 ? `Hashtags actuels : ${input.hashtags.join(" ")}` : null,
    input.action === "publication_change_tone" && input.tone ? `Ton souhaité : ${input.tone}` : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") || (isList ? "Aucun contenu existant." : "Aucun contenu existant.") };
}
