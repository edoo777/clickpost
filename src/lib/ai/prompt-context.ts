import type { ContentExample } from "@/types/brand";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { SocialPlatform } from "@/types/dashboard";
import type { Idea } from "@/types/idea";
import type { Theme } from "@/types/theme";

/**
 * Sous-ensemble des champs de marque utilisés par les prompts IA — satisfait structurellement
 * par `Brand` (Supabase) et `BrandProfile` (données de démonstration), sans dépendre de l'un
 * ou l'autre. Source unique pour éviter que Copilote, Atelier et futures fonctionnalités IA
 * divergent sur la compréhension de la marque.
 */
export interface BrandContextSource {
  name: string;
  industry: string;
  subNiche?: string;
  positioning?: string;
  valueProposition?: string;
  market?: string;
  description: string;
  toneOfVoice: string;
  targetAudience: string;
  audiencePainPoints: string[];
  communicationGoals: string[];
  priorityTopics: string[];
  productsAndServices: string[];
  topicsToAvoid: string[];
  preferredPhrases: string[];
  forbiddenWords: string[];
  preferredCtas: string[];
  socialPlatforms: SocialPlatform[];
  languages?: string[];
  publishingFrequency?: string;
  monthlyPublishingGoal?: number;
  preferredFormats?: ContentFormat[];
  successMetrics?: string[];
  contentExamples?: ContentExample[];
}

function joinList(items: string[] | undefined, label: string): string | null {
  if (!items || items.length === 0) return null;
  return `${label} : ${items.slice(0, 6).join(", ")}`;
}

function buildContentExamplesLine(examples: ContentExample[] | undefined): string | null {
  if (!examples || examples.length === 0) return null;
  return `Exemples de contenus représentatifs : ${examples
    .slice(0, 4)
    .map((example) => `« ${example.title} » (${example.platform})`)
    .join(" ; ")}`;
}

/** Contexte de marque complet, dans un format texte prêt à insérer dans un prompt. Chaque champ
 * renseigné dans le profil de marque (voir BrandProfileForm) doit apparaître ici — un champ
 * collecté côté formulaire mais jamais lu ici n'a aucun effet sur la génération IA malgré ce que
 * la barre de « complétude » du profil peut laisser croire (voir brand-completeness.ts). */
export function buildBrandContextLines(brand: BrandContextSource): string[] {
  return [
    `Marque : ${brand.name}`,
    `Secteur : ${brand.industry || "non précisé"}${brand.subNiche ? ` (${brand.subNiche})` : ""}`,
    brand.market ? `Marché cible : ${brand.market}` : null,
    brand.positioning ? `Positionnement : ${brand.positioning}` : null,
    brand.valueProposition ? `Proposition de valeur : ${brand.valueProposition}` : null,
    brand.description ? `Description : ${brand.description}` : null,
    `Ton de voix : ${brand.toneOfVoice || "non précisé"}`,
    `Audience cible : ${brand.targetAudience || "non précisée"}`,
    joinList(brand.audiencePainPoints, "Points de douleur de l'audience"),
    joinList(brand.communicationGoals, "Objectifs de communication"),
    joinList(brand.priorityTopics, "Thématiques prioritaires"),
    joinList(brand.productsAndServices, "Produits & services"),
    joinList(brand.topicsToAvoid, "Sujets à éviter"),
    joinList(brand.preferredPhrases, "Mots à privilégier"),
    joinList(brand.forbiddenWords, "Mots interdits"),
    joinList(brand.preferredCtas, "Appels à l'action préférés"),
    joinList(brand.socialPlatforms, "Réseaux sociaux"),
    joinList(brand.languages, "Langues"),
    joinList(brand.preferredFormats, "Formats privilégiés"),
    joinList(brand.successMetrics, "Indicateurs de réussite visés"),
    brand.publishingFrequency ? `Rythme de publication visé : ${brand.publishingFrequency}` : null,
    brand.monthlyPublishingGoal ? `Objectif mensuel de publications : ${brand.monthlyPublishingGoal}` : null,
    buildContentExamplesLine(brand.contentExamples),
  ].filter((line): line is string => Boolean(line));
}

/** Contexte d'une idée précise (Atelier), dans un format texte prêt à insérer dans un prompt. */
export function buildIdeaContextLines(idea: Idea, theme?: Theme): string[] {
  return [
    `Titre de l'idée : ${idea.title || "(sans titre)"}`,
    idea.description ? `Description : ${idea.description}` : null,
    idea.angle ? `Angle : ${idea.angle}` : null,
    idea.objective ? `Objectif : ${idea.objective}` : null,
    idea.targetAudience ? `Audience visée : ${idea.targetAudience}` : null,
    theme ? `Thématique éditoriale : ${theme.label}${theme.objective ? ` (${theme.objective})` : ""}` : null,
    idea.contentPlan ? `Plan de contenu : ${idea.contentPlan}` : null,
    idea.keyPoints && idea.keyPoints.length > 0 ? `Points clés : ${idea.keyPoints.slice(0, 8).join(", ")}` : null,
  ].filter((line): line is string => Boolean(line));
}
