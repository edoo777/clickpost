import type { GenerationLength, GenerationTone } from "@/lib/assisted-generation";
import { CONTENT_FORMATS } from "@/lib/editorial-constants";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TONES: GenerationTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "direct",
  "pedagogical",
  "inspiring",
  "conversational",
  "expert",
  "storytelling",
  "provocative",
];
const LENGTHS: GenerationLength[] = ["short", "medium", "long"];
const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "threads", "pinterest", "other"];
const MAX_TEXT_LENGTH = 1000;
const MAX_LABEL_LENGTH = 200;
const MAX_HASHTAGS = 30;

export interface ValidatedPublicationGenerationRequest {
  /** Absent en mode ponctuel (aucune marque sélectionnée) — même sentinelle que le Générateur
   * d'idées : la niche saisie manuellement fait alors foi, jamais une marque devinée. */
  brandId?: string;
  standaloneNiche?: string;
  platform: SocialPlatform;
  themeId?: string;
  adhocTheme?: string;
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

export type PublicationGenerationValidation =
  | { valid: true; value: ValidatedPublicationGenerationRequest }
  | { valid: false; message: string };

function boundedText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
}

export function validatePublicationGenerationRequest(body: unknown): PublicationGenerationValidation {
  if (typeof body !== "object" || body === null) return { valid: false, message: "Corps de requête invalide." };
  const record = body as Record<string, unknown>;

  let brandId: string | undefined;
  let standaloneNiche: string | undefined;
  if (typeof record.brandId === "string" && UUID_PATTERN.test(record.brandId)) {
    brandId = record.brandId;
  } else {
    standaloneNiche = boundedText(record.standaloneNiche, MAX_LABEL_LENGTH);
    if (!standaloneNiche) return { valid: false, message: "Marque ou niche requise." };
  }

  const platform = record.platform;
  if (typeof platform !== "string" || !ALL_PLATFORMS.includes(platform as SocialPlatform)) {
    return { valid: false, message: "Réseau social invalide." };
  }

  const format = record.format;
  if (typeof format !== "string" || !CONTENT_FORMATS.includes(format as ContentFormat)) {
    return { valid: false, message: "Format invalide." };
  }

  let themeId: string | undefined;
  if (typeof record.themeId === "string" && UUID_PATTERN.test(record.themeId)) themeId = record.themeId;
  const adhocTheme = themeId ? undefined : boundedText(record.adhocTheme, MAX_LABEL_LENGTH);

  let tone: GenerationTone | undefined;
  if (record.tone !== undefined) {
    if (typeof record.tone !== "string" || !TONES.includes(record.tone as GenerationTone)) {
      return { valid: false, message: "Ton invalide." };
    }
    tone = record.tone as GenerationTone;
  }

  const length: GenerationLength = LENGTHS.includes(record.length as GenerationLength) ? (record.length as GenerationLength) : "medium";

  let existingHashtags: string[] | undefined;
  if (record.existingHashtags !== undefined) {
    if (!Array.isArray(record.existingHashtags) || !record.existingHashtags.every((item) => typeof item === "string")) {
      return { valid: false, message: "Hashtags existants invalides." };
    }
    existingHashtags = record.existingHashtags.slice(0, MAX_HASHTAGS);
  }

  return {
    valid: true,
    value: {
      brandId,
      standaloneNiche,
      platform: platform as SocialPlatform,
      themeId,
      adhocTheme,
      contentType: boundedText(record.contentType, MAX_LABEL_LENGTH),
      format: format as ContentFormat,
      objective: boundedText(record.objective),
      audience: boundedText(record.audience),
      tone,
      language: boundedText(record.language, 40),
      length,
      instructions: boundedText(record.instructions),
      existingTitle: boundedText(record.existingTitle, MAX_LABEL_LENGTH),
      existingText: boundedText(record.existingText, 3000),
      existingCta: boundedText(record.existingCta, MAX_LABEL_LENGTH),
      existingHashtags,
    },
  };
}
