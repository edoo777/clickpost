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
/** Plafond par thématique dans UN appel serveur — le client ne doit jamais envoyer plus qu'un lot
 * (voir DEFAULT_LOT_SIZE dans topic-generator.ts, 20 par défaut) ; une marge est laissée ici pour
 * ne pas coupler strictement les deux constantes. Les plafonds "100 par thématique" et "200 par
 * génération" annoncés à l'utilisateur sont appliqués côté formulaire, avant tout découpage en
 * lots — cette limite-ci est un garde-fou serveur indépendant contre un appel direct hors client. */
const MAX_REQUESTED_PER_THEME_PER_CALL = 25;
const MAX_TOTAL_PER_CALL = 100;
const MAX_THEMES = 10;
const MAX_TEXT_LENGTH = 1000;
const MAX_LABEL_LENGTH = 120;

export interface ValidatedThemeRequest {
  themeId: string;
  isAdhoc: boolean;
  /** Requis et utilisé uniquement lorsque isAdhoc est vrai — sinon le libellé réel de la
   * thématique (paramètres de la marque) fait toujours foi. */
  themeLabel?: string;
  requestedCount: number;
  distribution: Partial<Record<ContentType, number>>;
}

export interface ValidatedTopicsRequest {
  /** Absent en mode ponctuel (standalone) — aucune marque réelle associée. */
  brandId?: string;
  standalone: boolean;
  /** Requis et utilisé uniquement en mode ponctuel — sinon brand.industry (base de données)
   * fait toujours foi. */
  niche?: string;
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

  const standalone = Boolean(record.standalone);
  let brandId: string | undefined;
  let niche: string | undefined;
  if (standalone) {
    const nicheRaw = record.niche;
    if (typeof nicheRaw !== "string" || nicheRaw.trim().length === 0) {
      return { valid: false, message: "Niche requise pour une génération ponctuelle." };
    }
    niche = nicheRaw.trim().slice(0, MAX_LABEL_LENGTH);
  } else {
    const brandIdRaw = record.brandId;
    if (typeof brandIdRaw !== "string" || !UUID_PATTERN.test(brandIdRaw)) {
      return { valid: false, message: "Identifiant de marque invalide." };
    }
    brandId = brandIdRaw;
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
    const isAdhoc = Boolean(themeEntry.isAdhoc);
    if (standalone && !isAdhoc) {
      return { valid: false, message: "Une génération ponctuelle ne peut utiliser que des thématiques ponctuelles." };
    }
    let themeLabel: string | undefined;
    if (isAdhoc) {
      const labelRaw = themeEntry.themeLabel;
      if (typeof labelRaw !== "string" || labelRaw.trim().length === 0) {
        return { valid: false, message: "Libellé requis pour une thématique ponctuelle." };
      }
      themeLabel = labelRaw.trim().slice(0, MAX_LABEL_LENGTH);
    }
    const requestedCount = themeEntry.requestedCount;
    if (
      typeof requestedCount !== "number" ||
      !Number.isFinite(requestedCount) ||
      requestedCount < 1 ||
      requestedCount > MAX_REQUESTED_PER_THEME_PER_CALL
    ) {
      return { valid: false, message: `Nombre d'idées invalide pour une thématique (maximum ${MAX_REQUESTED_PER_THEME_PER_CALL} par appel).` };
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

    themes.push({ themeId, isAdhoc, themeLabel, requestedCount, distribution });
  }

  if (totalRequested > MAX_TOTAL_PER_CALL) {
    return { valid: false, message: `Le total d'idées demandées dans un même appel ne peut pas dépasser ${MAX_TOTAL_PER_CALL}.` };
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
      standalone,
      niche,
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
