import type { ContentType } from "@/lib/content-types";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export interface ContentExample {
  id: string;
  platform: SocialPlatform;
  title: string;
  excerpt: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  /** Niche — secteur général de la marque (ex. Fitness, Immobilier). */
  industry: string;
  /** Sous-niche facultative, plus précise que la niche (ex. Musculation pour Fitness). */
  subNiche?: string;
  /** Positionnement — la place que la marque occupe face à la concurrence, distinct de
   * `valueProposition` (la promesse concrète faite au client) et de `description`. */
  positioning?: string;
  /** Marché ou pays cible facultatif. */
  market?: string;
  description: string;
  productsAndServices: string[];
  targetAudience: string;
  /** Problèmes/frustrations concrets de l'audience — ce que le contenu doit adresser. */
  audiencePainPoints: string[];
  communicationGoals: string[];
  toneOfVoice: string;
  languages: string[];
  priorityTopics: string[];
  topicsToAvoid: string[];
  preferredPhrases: string[];
  forbiddenWords: string[];
  preferredCtas: string[];
  socialPlatforms: SocialPlatform[];
  contentExamples: ContentExample[];
  /** Promesse concrète faite au client — distincte du positionnement (la place face à la
   * concurrence) et de la description générale. */
  valueProposition?: string;
  /** Rythme de publication visé, texte libre (ex. « 3 fois par semaine »). */
  publishingFrequency?: string;
  /** Objectif chiffré de publications par mois — 0 si non défini, jamais une valeur devinée. */
  monthlyPublishingGoal?: number;
  preferredContentTypes: ContentType[];
  preferredFormats: ContentFormat[];
  /** Indicateurs choisis par l'utilisateur pour juger du succès éditorial (ex. « Taux
   * d'engagement », « Abonnés gagnés ») — jamais une donnée mesurée automatiquement ici. */
  successMetrics: string[];
}

export type BrandStatus = "active" | "archived";

/**
 * Marque réelle, synchronisée avec Supabase (F1.5) — distincte de `BrandProfile`
 * (données de démonstration statiques, jamais synchronisées, conservées telles quelles).
 * Reprend la forme de `BrandProfile` pour rester compatible avec `getBrandCompleteness`/
 * `BrandCard`/`BrandProfileView`, plus les champs additifs et les métadonnées de synchronisation.
 */
export interface Brand {
  id: string;
  workspaceId: string;
  name: string;
  /** Niche — secteur général de la marque (ex. Fitness, Immobilier). */
  industry: string;
  /** Sous-niche facultative, plus précise que la niche. */
  subNiche?: string;
  /** Positionnement — distinct de `valueProposition` et de `description`. */
  positioning?: string;
  /** Marché ou pays cible facultatif. */
  market?: string;
  description: string;
  productsAndServices: string[];
  targetAudience: string;
  audiencePainPoints: string[];
  communicationGoals: string[];
  toneOfVoice: string;
  languages: string[];
  priorityTopics: string[];
  topicsToAvoid: string[];
  preferredPhrases: string[];
  forbiddenWords: string[];
  preferredCtas: string[];
  socialPlatforms: SocialPlatform[];
  contentExamples: ContentExample[];
  valueProposition?: string;
  publishingFrequency?: string;
  monthlyPublishingGoal?: number;
  preferredContentTypes: ContentType[];
  preferredFormats: ContentFormat[];
  successMetrics: string[];
  logoUrl?: string;
  website?: string;
  timeZone?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  status: BrandStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  revision: number;
}
