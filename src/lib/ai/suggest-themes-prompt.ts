export interface SuggestThemesPromptInput {
  brandName: string;
  niche: string;
  subNiche?: string;
  positioning?: string;
  targetAudience?: string;
  existingThemeLabels: string[];
}

export interface SuggestThemesPrompt {
  system: string;
  user: string;
}

const CONTENT_TYPE_EXAMPLES = "Conseil, Preuve, Offre, Témoignage, Opinion, Étude de cas";

/** Prompt de suggestion de thématiques éditoriales — jamais de type de contenu (Conseil, Preuve…)
 * proposé comme thématique. Les suggestions ne sont jamais enregistrées automatiquement. */
export function buildSuggestThemesPrompt(input: SuggestThemesPromptInput): SuggestThemesPrompt {
  const system = [
    "Tu es un stratège de contenu francophone. On te donne la niche et le positionnement d'une",
    "marque ; tu dois proposer des THÉMATIQUES ÉDITORIALES — des sujets qui découlent de la",
    "niche (ex. pour la niche Fitness : Musculation, Nutrition, Course à pied, Récupération).",
    "",
    `INTERDICTION ABSOLUE : ne propose jamais un type de contenu (angle éditorial, ex. ${CONTENT_TYPE_EXAMPLES}) comme thématique.`,
    "Une thématique est un sujet, jamais un angle de traitement.",
    "",
    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, exactement de cette forme :",
    '{"suggestions":[{"name":"...","description":"..."}]}',
    "Propose entre 5 et 10 suggestions, sans doublon avec les thématiques déjà existantes fournies.",
  ].join("\n");

  const userLines = [
    `Marque : ${input.brandName}`,
    `Niche : ${input.niche || "non précisée"}`,
    input.subNiche ? `Sous-niche : ${input.subNiche}` : null,
    input.positioning ? `Positionnement : ${input.positioning}` : null,
    input.targetAudience ? `Clientèle cible : ${input.targetAudience}` : null,
    input.existingThemeLabels.length > 0
      ? `Thématiques déjà existantes (ne pas répéter) : ${input.existingThemeLabels.join(", ")}`
      : "Aucune thématique existante pour l'instant.",
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}
