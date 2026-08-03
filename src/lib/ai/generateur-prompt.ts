import { ALL_CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export interface GenerateurPromptTheme {
  themeId: string;
  label: string;
  requestedCount: number;
  distribution: Partial<Record<ContentType, number>>;
}

export interface GenerateurPromptInput {
  niche: string;
  brandName: string;
  themes: GenerateurPromptTheme[];
  formats: ContentFormat[];
  platforms: SocialPlatform[];
  objective?: string;
  targetAudience?: string;
  tone: string;
  instructions?: string;
  /** Contexte stratégique additif de la marque (Phase B) — jamais requis, ignoré si absent. */
  valueProposition?: string;
  audiencePainPoints?: string[];
  preferredContentTypes?: string[];
}

export interface GenerateurPrompt {
  system: string;
  user: string;
}

const CONTENT_TYPE_LIST = ALL_CONTENT_TYPES.map((type) => `"${type}" (${CONTENT_TYPE_LABEL[type]})`).join(", ");

/**
 * Construit le prompt d'une génération multi-thématiques pour le Générateur d'idées. Insiste
 * explicitement sur la séparation niche / thématique / type de contenu — Claude ne doit jamais
 * renvoyer un type de contenu (Conseil, Preuve, Offre…) dans le champ thématique.
 */
export function buildGenerateurPrompt(input: GenerateurPromptInput): GenerateurPrompt {
  const formatList = input.formats.map((format) => FORMAT_LABEL[format]).join(", ") || "au choix";
  const hasPlatforms = input.platforms.length > 0;
  const platformList = hasPlatforms ? input.platforms.map((platform) => PLATFORM_LABEL[platform]).join(", ") : null;

  const system = [
    "Tu es un stratège de contenu francophone pour une agence marketing. Tu dois générer des",
    "idées de publications regroupées par thématique, pour la marque suivante :",
    `- Marque : ${input.brandName}`,
    `- Niche (secteur) : ${input.niche || "non précisée"}`,
    "",
    "DISTINCTION STRICTE À RESPECTER — cinq concepts différents, jamais interchangeables :",
    "1. niche : le secteur général de la marque (ex. Fitness, Immobilier) — déjà fourni ci-dessus, à reporter tel quel.",
    "2. thématique (theme) : un sujet qui découle de la niche (ex. Musculation, Nutrition, Course à pied) — JAMAIS un angle éditorial, JAMAIS le nom d'un réseau social.",
    `3. type de contenu (contentType) : l'angle éditorial utilisé pour traiter la thématique. Valeurs autorisées UNIQUEMENT : ${CONTENT_TYPE_LIST}.`,
    "4. format : la forme de la publication (ex. Carrousel, Vidéo courte).",
    "5. plateforme (platform) : le réseau social visé (ex. Instagram, LinkedIn) — un simple contexte éditorial pour adapter le ton/format, jamais un sujet ni une thématique.",
    "",
    'INTERDICTION ABSOLUE : ne jamais placer un type de contenu ("Conseil", "Preuve", "Offre", "Témoignage"…) dans le champ theme.',
    'INTERDICTION ABSOLUE : ne jamais déduire ou inventer une thématique à partir d\'une plateforme — ne transforme jamais "Instagram", "LinkedIn" ou "TikTok" en thématique.',
    "Le champ theme doit toujours être exactement l'un des libellés de thématique fournis dans la demande, reproduit à l'identique.",
    hasPlatforms
      ? "Adapte le comportement et le format suggéré des idées aux plateformes visées ci-dessous, sans jamais changer la thématique elle-même."
      : 'Aucune plateforme spécifique n\'est visée : génère des idées générales, adaptables à plusieurs contextes, sans supposer une plateforme précise ni la mentionner comme "au choix" dans le contenu.',
    "",
    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, exactement de cette forme :",
    '{"groups":[{"themeId":"...","ideas":[{"title":"...","description":"...","niche":"...","theme":"...","contentType":"advice","format":"...","objective":"...","platform":"..."}]}]}',
    `Le champ contentType doit être l'une de ces valeurs exactes (en anglais, minuscules) : ${ALL_CONTENT_TYPES.join(", ")}.`,
    "Un objet « groups » par thématique demandée, dans le même ordre que la demande, avec le même themeId.",
  ].join("\n");

  const themeLines = input.themes.map((theme) => {
    const distributionText = Object.entries(theme.distribution)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([type, count]) => `${count} ${CONTENT_TYPE_LABEL[type as ContentType]}`)
      .join(", ");
    return [
      `- Thématique « ${theme.label} » (themeId: ${theme.themeId}) : ${theme.requestedCount} idées au total.`,
      distributionText ? `  Répartition des types de contenu à respecter : ${distributionText}.` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const userLines = [
    "Thématiques à traiter dans cette génération :",
    ...themeLines,
    "",
    `Formats autorisés : ${formatList}`,
    platformList ? `Plateformes visées : ${platformList}` : "Plateformes visées : aucune en particulier — idées générales.",
    `Ton de marque : ${input.tone}`,
    input.objective ? `Objectif marketing général : ${input.objective}` : null,
    input.targetAudience ? `Audience cible : ${input.targetAudience}` : null,
    input.valueProposition ? `Proposition de valeur de la marque : ${input.valueProposition}` : null,
    input.audiencePainPoints && input.audiencePainPoints.length > 0
      ? `Problèmes de l'audience à adresser : ${input.audiencePainPoints.join(", ")}`
      : null,
    input.preferredContentTypes && input.preferredContentTypes.length > 0
      ? `Types de contenu privilégiés par la marque : ${input.preferredContentTypes.join(", ")}`
      : null,
    input.instructions ? `Instructions supplémentaires : ${input.instructions}` : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}
