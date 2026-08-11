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
  /** Positionnement et description de la marque — jamais requis, ignorés si absents. */
  positioning?: string;
  description?: string;
  /** Titres déjà présents dans le workspace (sujets/idées existants pour cette marque) — jamais
   * envoyés pour être recopiés, uniquement pour que Claude évite de générer un doublon ou une
   * simple paraphrase d'un sujet déjà traité. */
  existingTitles?: string[];
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
    "sujets de publications regroupés par thématique, pour la marque suivante :",
    `- Marque : ${input.brandName}`,
    `- Niche (secteur) : ${input.niche || "non précisée"}`,
    input.positioning ? `- Positionnement : ${input.positioning}` : null,
    input.description ? `- Description : ${input.description}` : null,
    "",
    "DISTINCTION STRICTE À RESPECTER — six concepts différents, jamais interchangeables :",
    "1. niche : le secteur général de la marque (ex. Fitness, Immobilier) — déjà fourni ci-dessus, à reporter tel quel.",
    "2. thématique (theme) : un pilier éditorial récurrent qui découle de la niche (ex. Musculation, Nutrition, Course à pied) — large et stable dans le temps, JAMAIS un sujet précis, JAMAIS un angle, JAMAIS le nom d'un réseau social.",
    "3. sujet (title) : une déclinaison concrète et spécifique de la thématique (ex. pour la thématique « Automatisation » : « 5 tâches qu'un dirigeant devrait automatiser ») — jamais une reformulation générique de la thématique elle-même.",
    "4. angle (angle) : le point de vue ou la façon précise de traiter ce sujet (ex. « Pourquoi continuer à les faire soi-même coûte plus cher ») — une prise de position ou un fil conducteur concret, jamais un mot-clé isolé, jamais une répétition du titre.",
    `5. type de contenu (contentType) : la catégorie éditoriale du sujet. Valeurs autorisées UNIQUEMENT : ${CONTENT_TYPE_LIST}.`,
    "6. format et plateforme : la forme de la publication et le réseau social visé — un contexte éditorial pour adapter le ton/format, jamais un sujet ni une thématique.",
    "",
    'INTERDICTION ABSOLUE : ne jamais placer un type de contenu ("Conseil", "Preuve", "Offre", "Témoignage"…) dans le champ theme.',
    'INTERDICTION ABSOLUE : ne jamais déduire ou inventer une thématique à partir d\'une plateforme — ne transforme jamais "Instagram", "LinkedIn" ou "TikTok" en thématique.',
    "Le champ theme doit toujours être exactement l'un des libellés de thématique fournis dans la demande, reproduit à l'identique.",
    hasPlatforms
      ? "Adapte le comportement et le format suggéré des sujets aux plateformes visées ci-dessous, sans jamais changer la thématique elle-même."
      : 'Aucune plateforme spécifique n\'est visée : génère des sujets généraux, adaptables à plusieurs contextes, sans supposer une plateforme précise ni la mentionner comme "au choix" dans le contenu.',
    "",
    "QUALITÉ ATTENDUE — chaque sujet doit être concret et spécifique à cette marque et à cette",
    "audience, jamais un titre générique interchangeable avec n'importe quelle autre marque du",
    "même secteur. Interdits explicites : les titres formulés comme \"<Thématique> : <mot-clé>\"",
    "ou \"<Thématique> — ce qu'il faut savoir sur <mot-clé>\" (gabarits creux) ; les paraphrases d'un",
    "même sujet au sein de la même génération ; les titres à consonance SEO artificielle",
    "(\"Top 10\", \"Le guide ultime\", \"Tout savoir sur\") sans contenu concret derrière ; deux sujets",
    "qui ne diffèrent que par un mot. Chaque sujet doit pouvoir se distinguer clairement des autres",
    "par son idée, pas seulement par sa formulation.",
    "",
    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, exactement de cette forme :",
    '{"groups":[{"themeId":"...","ideas":[{"title":"...","angle":"...","description":"...","niche":"...","theme":"...","contentType":"advice","format":"...","objective":"...","platform":"..."}]}]}',
    `Le champ contentType doit être l'une de ces valeurs exactes (en anglais, minuscules) : ${ALL_CONTENT_TYPES.join(", ")}.`,
    "Un objet « groups » par thématique demandée, dans le même ordre que la demande, avec le même themeId.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

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
    input.existingTitles && input.existingTitles.length > 0
      ? [
          "Sujets déjà présents dans le workspace de cette marque — ne les recopie jamais, ne les",
          "paraphrase jamais, propose uniquement des sujets réellement distincts de cette liste :",
          ...input.existingTitles.map((title) => `- ${title}`),
        ].join("\n")
      : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}
