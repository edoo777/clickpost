import type { GenerationLength, GenerationTone } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

/**
 * Contexte déjà revérifié côté serveur (jamais transmis tel quel par le client) — voir la route
 * associée, qui relit la marque/thématique depuis Supabase avant d'appeler cette fonction.
 */
export interface PublicationGenerationPromptInput {
  brandName?: string;
  niche?: string;
  positioning?: string;
  valueProposition?: string;
  brandTone?: string;
  brandAudience?: string;
  audiencePainPoints?: string[];
  priorityTopics?: string[];
  preferredCtas?: string[];
  forbiddenWords?: string[];
  connectedAccountHandles?: string[];
  themeLabel?: string;
  themeObjective?: string;
  platform: SocialPlatform;
  contentType?: string;
  format: ContentFormat;
  objective?: string;
  audience?: string;
  tone?: GenerationTone;
  language?: string;
  length: GenerationLength;
  instructions?: string;
  existingTitle?: string;
  existingText?: string;
  existingCta?: string;
  existingHashtags?: string[];
}

export interface PublicationGenerationPrompt {
  system: string;
  user: string;
}

const LENGTH_GUIDE: Record<GenerationLength, string> = {
  short: "courte (1 à 2 phrases pour le texte principal)",
  medium: "moyenne (un paragraphe court)",
  long: "longue (plusieurs paragraphes courts)",
};

/**
 * Construit le prompt de génération complète d'une publication — utilisé uniquement par
 * /api/ia/publications/generate, sur clic explicite « Générer »/« Régénérer ». Jamais de média
 * inventé : la sortie décrit ce qu'il faudrait produire, sans jamais prétendre qu'un fichier a
 * été créé ou joint.
 */
export function buildPublicationGenerationPrompt(input: PublicationGenerationPromptInput): PublicationGenerationPrompt {
  const system = [
    "Tu es l'assistant éditorial de ClickPost. Tu proposes le contenu d'une publication de réseau",
    "social, à partir du contexte de marque et des champs déjà fournis par l'utilisateur.",
    "",
    "Règles strictes :",
    "- N'invente aucun fait, chiffre, promotion ou événement non fourni dans le contexte.",
    "- Respecte le ton et les mots interdits de la marque s'ils sont fournis.",
    "- \"mediaSuggestion\" décrit UNIQUEMENT, en texte, le type de visuel qu'il faudrait produire",
    "  (ex. \"une photo du produit en situation\") — ne prétends JAMAIS qu'un média a été créé,",
    "  généré ou joint : aucun fichier n'existe à ce stade.",
    "- Si des champs \"déjà rédigés par l'utilisateur\" sont fournis plus bas, propose une version",
    "  cohérente avec eux plutôt que de partir dans une direction différente.",
    `- Longueur souhaitée pour le texte principal : ${LENGTH_GUIDE[input.length]}.`,
    "- Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, exactement sous cette",
    '  forme : {"theme": string, "objective": string, "titles": string[] (exactement trois),',
    '  "text": string, "cta": string, "hashtags": string[] (cinq à huit, chacun commençant par #),',
    '  "formatSuggestion": string, "mediaSuggestion": string}.',
  ].join("\n");

  const userLines = [
    input.brandName ? `Marque : ${input.brandName}` : null,
    input.niche ? `Niche : ${input.niche}` : null,
    input.positioning ? `Positionnement : ${input.positioning}` : null,
    input.valueProposition ? `Proposition de valeur : ${input.valueProposition}` : null,
    input.brandTone ? `Ton de marque : ${input.brandTone}` : null,
    input.brandAudience ? `Audience de la marque : ${input.brandAudience}` : null,
    input.audiencePainPoints && input.audiencePainPoints.length > 0
      ? `Problèmes de cette audience à adresser : ${input.audiencePainPoints.join(", ")}`
      : null,
    input.priorityTopics && input.priorityTopics.length > 0 ? `Sujets prioritaires de la marque : ${input.priorityTopics.join(", ")}` : null,
    input.preferredCtas && input.preferredCtas.length > 0 ? `Appels à l'action préférés de la marque : ${input.preferredCtas.join(", ")}` : null,
    input.forbiddenWords && input.forbiddenWords.length > 0 ? `Mots interdits : ${input.forbiddenWords.join(", ")}` : null,
    input.connectedAccountHandles && input.connectedAccountHandles.length > 0
      ? `Comptes affiliés connectés : ${input.connectedAccountHandles.join(", ")}`
      : null,
    input.themeLabel ? `Thématique : ${input.themeLabel}` : null,
    input.themeObjective ? `Objectif de la thématique : ${input.themeObjective}` : null,
    `Plateforme cible : ${input.platform}`,
    input.contentType ? `Type de contenu : ${input.contentType}` : null,
    `Format : ${input.format}`,
    input.objective ? `Objectif de cette publication : ${input.objective}` : null,
    input.audience ? `Audience visée pour cette publication : ${input.audience}` : null,
    input.tone ? `Ton souhaité : ${input.tone}` : null,
    input.language ? `Langue : ${input.language}` : null,
    input.instructions ? `Instruction complémentaire : ${input.instructions}` : null,
    input.existingTitle ? `Titre déjà rédigé par l'utilisateur : ${input.existingTitle}` : null,
    input.existingText ? `Texte déjà rédigé par l'utilisateur : ${input.existingText}` : null,
    input.existingCta ? `Appel à l'action déjà rédigé par l'utilisateur : ${input.existingCta}` : null,
    input.existingHashtags && input.existingHashtags.length > 0 ? `Hashtags déjà présents : ${input.existingHashtags.join(" ")}` : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}
