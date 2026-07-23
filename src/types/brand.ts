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
