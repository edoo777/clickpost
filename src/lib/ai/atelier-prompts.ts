import type { AIGenerationContext } from "@/lib/assisted-generation";

export interface AtelierPrompt {
  system: string;
  user: string;
}

const MAX_LIST_ITEMS = 8;

function joinList(items: string[] | undefined, fallback = "aucune"): string {
  if (!items || items.length === 0) return fallback;
  return items.slice(0, MAX_LIST_ITEMS).join(", ");
}

/**
 * Construit le prompt envoyé à Claude pour la génération complète d'une publication texte dans
 * l'Atelier — seule action réellement branchée en F2.1. Demande explicitement une réponse JSON
 * stricte (mêmes champs que `TextBody`) pour permettre une validation fiable côté route serveur,
 * sans dépendre d'un format libre à parser heuristiquement.
 */
export function buildAtelierGenerationPrompt(context: AIGenerationContext): AtelierPrompt {
  const { idea, brand, theme, tone, length, instructions } = context;

  const system = [
    "Tu es un rédacteur publicitaire francophone qui écrit des publications pour les réseaux sociaux",
    `d'une agence marketing, au nom de la marque « ${brand.name} » (secteur : ${brand.industry || "non précisé"}).`,
    brand.positioning ? `Positionnement : ${brand.positioning}.` : null,
    brand.valueProposition ? `Proposition de valeur : ${brand.valueProposition}.` : null,
    `Voix de la marque : ${brand.toneOfVoice || "non précisée"}.`,
    `Audience cible : ${brand.targetAudience || "non précisée"}.`,
    brand.audiencePainPoints && brand.audiencePainPoints.length > 0
      ? `Problèmes de cette audience à adresser : ${joinList(brand.audiencePainPoints)}.`
      : null,
    `Expressions à privilégier : ${joinList(brand.preferredPhrases)}.`,
    `Mots interdits : ${joinList(brand.forbiddenWords)}.`,
    `Sujets à éviter : ${joinList(brand.topicsToAvoid)}.`,
    `Appels à l'action habituels de la marque : ${joinList(brand.preferredCtas)}.`,
    "",
    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, exactement de cette forme :",
    '{"hook":"...","intro":"...","body":"...","conclusion":"...","cta":"...","hashtags":["..."]}',
    "Aucun champ ne doit être omis ; utilise une chaîne vide ou un tableau vide si non pertinent.",
  ].join("\n");

  const userLines = [
    `Titre de l'idée : ${idea.title || "(sans titre)"}`,
    idea.description ? `Description : ${idea.description}` : null,
    idea.angle ? `Angle : ${idea.angle}` : null,
    idea.objective ? `Objectif : ${idea.objective}` : null,
    idea.targetAudience ? `Audience visée pour ce contenu : ${idea.targetAudience}` : null,
    theme ? `Thématique éditoriale : ${theme.label}${theme.objective ? ` (${theme.objective})` : ""}` : null,
    `Ton demandé : ${tone}`,
    `Longueur souhaitée : ${length}`,
    instructions ? `Instructions supplémentaires : ${instructions}` : null,
  ].filter((line): line is string => Boolean(line));

  return { system, user: userLines.join("\n") };
}
