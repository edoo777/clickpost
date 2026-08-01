import { ALL_CONTENT_TYPES, type ContentType } from "@/lib/content-types";
import type { GenerationTone } from "@/lib/assisted-generation";
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
const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const MAX_TOTAL_IDEAS = 100;
const MAX_THEMES = 10;
const MAX_TEXT_LENGTH = 1000;

export interface ValidatedThemeRequest {
  themeId: string;
  requestedCount: number;
  distribution: Partial<Record<ContentType, number>>;
}

export interface ValidatedTopicsRequest {
  brandId: string;
  themes: ValidatedThemeRequest[];
  formats: ContentFormat[];
  platforms: SocialPlatform[];
  objective: string;
  targetAudience: string;
  tone: GenerationTone;
  instructions: string;
}

export type TopicsRequestValidation = { valid: true; value: ValidatedTopicsRequest } | { valid: false; message: string };

function boundedText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_TEXT_LENGTH) : "";
}

export function validateTopicsRequest(body: unknown): TopicsRequestValidation {
  if (typeof body !== "object" || body === null) return { valid: false, message: "Corps de requête invalide." };
  const record = body as Record<string, unknown>;

  const brandId = record.brandId;
  if (typeof brandId !== "string" || !UUID_PATTERN.test(brandId)) {
    return { valid: false, message: "Identifiant de marque invalide." };
  }

  const themesRaw = record.themes;
  if (!Array.isArray(themesRaw) || themesRaw.length === 0 || themesRaw.length > MAX_THEMES) {
    return { valid: false, message: `Fournissez entre 1 et ${MAX_THEMES} thématiques.` };
  }

  const themes: ValidatedThemeRequest[] = [];
  let totalRequested = 0;
  for (const entry of themesRaw) {
    if (typeof entry !== "object" || entry === null) return { valid: false, message: "Thématique invalide." };
    const themeEntry = entry as Record<string, unknown>;
    const themeId = themeEntry.themeId;
    if (typeof themeId !== "string" || !UUID_PATTERN.test(themeId)) {
      return { valid: false, message: "Identifiant de thématique invalide." };
    }
    const requestedCount = themeEntry.requestedCount;
    if (typeof requestedCount !== "number" || !Number.isFinite(requestedCount) || requestedCount < 1 || requestedCount > MAX_TOTAL_IDEAS) {
      return { valid: false, message: "Nombre d'idées invalide pour une thématique." };
    }
    totalRequested += requestedCount;

    const distributionRaw = themeEntry.distribution;
    const distribution: Partial<Record<ContentType, number>> = {};
    if (distributionRaw !== undefined) {
      if (typeof distributionRaw !== "object" || distributionRaw === null) {
        return { valid: false, message: "Répartition des types de contenu invalide." };
      }
      for (const [key, value] of Object.entries(distributionRaw as Record<string, unknown>)) {
        if (!ALL_CONTENT_TYPES.includes(key as ContentType)) continue;
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          return { valid: false, message: "Répartition des types de contenu invalide." };
        }
        if (value > 0) distribution[key as ContentType] = Math.floor(value);
      }
    }

    themes.push({ themeId, requestedCount, distribution });
  }

  if (totalRequested > MAX_TOTAL_IDEAS) {
    return { valid: false, message: `Le total d'idées demandées ne peut pas dépasser ${MAX_TOTAL_IDEAS}.` };
  }

  const formatsRaw = record.formats;
  if (!Array.isArray(formatsRaw) || formatsRaw.length === 0 || !formatsRaw.every((f) => CONTENT_FORMATS.includes(f as ContentFormat))) {
    return { valid: false, message: "Formats invalides." };
  }

  const platformsRaw = record.platforms;
  if (!Array.isArray(platformsRaw) || platformsRaw.length === 0 || !platformsRaw.every((p) => ALL_PLATFORMS.includes(p as SocialPlatform))) {
    return { valid: false, message: "Plateformes invalides." };
  }

  const tone = record.tone;
  if (typeof tone !== "string" || !TONES.includes(tone as GenerationTone)) {
    return { valid: false, message: "Ton invalide." };
  }

  return {
    valid: true,
    value: {
      brandId,
      themes,
      formats: formatsRaw as ContentFormat[],
      platforms: platformsRaw as SocialPlatform[],
      objective: boundedText(record.objective),
      targetAudience: boundedText(record.targetAudience),
      tone: tone as GenerationTone,
      instructions: boundedText(record.instructions),
    },
  };
}
