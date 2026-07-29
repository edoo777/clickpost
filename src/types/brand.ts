import type { SocialPlatform } from "@/types/dashboard";

export interface ContentExample {
  id: string;
  platform: SocialPlatform;
  title: string;
  excerpt: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
  productsAndServices: string[];
  targetAudience: string;
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
  industry: string;
  description: string;
  productsAndServices: string[];
  targetAudience: string;
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
