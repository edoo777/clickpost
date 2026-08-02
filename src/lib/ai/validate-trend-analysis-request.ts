import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "threads", "pinterest", "other"];
const MAX_TITLE_LENGTH = 300;
const MAX_TEXT_LENGTH = 1000;
const MAX_LABEL_LENGTH = 80;
const MAX_THEME_LABELS = 10;

export interface ValidatedTrendAnalysisRequest {
  title: string;
  summary?: string;
  platform?: SocialPlatform;
  sourceName: string;
  sourceUrl: string;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
}

export type TrendAnalysisValidation = { valid: true; value: ValidatedTrendAnalysisRequest } | { valid: false; message: string };

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
}

/**
 * Valide une demande d'analyse Claude portant uniquement sur un élément de tendance déjà
 * collecté côté client (jamais relu depuis Supabase ici) — même architecture de validation que
 * validate-quick-action-request.ts, catalogue distinct.
 */
export function validateTrendAnalysisRequest(body: unknown): TrendAnalysisValidation {
  if (typeof body !== "object" || body === null) return { valid: false, message: "Corps de requête invalide." };
  const record = body as Record<string, unknown>;

  const title = boundedText(record.title, MAX_TITLE_LENGTH);
  if (!title) return { valid: false, message: "Titre requis." };

  const sourceName = boundedText(record.sourceName, 200);
  if (!sourceName) return { valid: false, message: "Nom de la source requis." };

  const sourceUrl = boundedText(record.sourceUrl, 500);
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) return { valid: false, message: "URL de source invalide." };

  const summary = boundedText(record.summary, MAX_TEXT_LENGTH);
  const brandName = boundedText(record.brandName, 200);
  const niche = boundedText(record.niche, 200);

  let platform: SocialPlatform | undefined;
  if (record.platform !== undefined) {
    if (typeof record.platform !== "string" || !ALL_PLATFORMS.includes(record.platform as SocialPlatform)) {
      return { valid: false, message: "Plateforme invalide." };
    }
    platform = record.platform as SocialPlatform;
  }

  let themeLabels: string[] = [];
  if (record.themeLabels !== undefined) {
    if (!Array.isArray(record.themeLabels) || !record.themeLabels.every((item) => typeof item === "string")) {
      return { valid: false, message: "Thématiques invalides." };
    }
    themeLabels = record.themeLabels.slice(0, MAX_THEME_LABELS).map((label) => label.slice(0, MAX_LABEL_LENGTH));
  }

  return { valid: true, value: { title, summary, platform, sourceName, sourceUrl, brandName, niche, themeLabels } };
}
