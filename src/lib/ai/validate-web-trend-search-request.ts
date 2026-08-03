import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "threads", "pinterest", "other"];
const VALID_PERIODS = ["24h", "7d", "30d", "all"] as const;
const MAX_PLATFORMS_GLOBAL = 8;
const MAX_LABEL_LENGTH = 200;
const MAX_THEME_LABELS = 10;

export interface ValidatedWebTrendSearchRequest {
  mode: "global" | "targeted";
  focus: "platform_trends" | "music";
  platforms: SocialPlatform[];
  niche?: string;
  themeLabels: string[];
  country?: string;
  language?: string;
  period: (typeof VALID_PERIODS)[number];
}

export type WebTrendSearchValidation = { valid: true; value: ValidatedWebTrendSearchRequest } | { valid: false; message: string };

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
}

/**
 * Valide une demande de veille Web — un mode "targeted" porte exactement une plateforme (celle
 * dont la section est vide), un mode "global" peut en couvrir plusieurs en une seule recherche
 * groupée (réduction de coût, voir web-search-quota.ts). Aucun champ n'est jamais complété par
 * une valeur devinée : absent = absent, transmis tel quel au prompt.
 */
export function validateWebTrendSearchRequest(body: unknown): WebTrendSearchValidation {
  if (typeof body !== "object" || body === null) return { valid: false, message: "Corps de requête invalide." };
  const record = body as Record<string, unknown>;

  const mode = record.mode;
  if (mode !== "global" && mode !== "targeted") return { valid: false, message: "Mode de recherche invalide." };

  const focus = record.focus === "music" ? "music" : "platform_trends";

  let platforms: SocialPlatform[];
  if (mode === "targeted") {
    if (typeof record.platform !== "string" || !ALL_PLATFORMS.includes(record.platform as SocialPlatform)) {
      return { valid: false, message: "Plateforme requise pour une recherche ciblée." };
    }
    platforms = [record.platform as SocialPlatform];
  } else {
    if (!Array.isArray(record.platforms) || record.platforms.length === 0) {
      return { valid: false, message: "Au moins une plateforme requise pour une recherche globale." };
    }
    const filtered = record.platforms.filter((p): p is SocialPlatform => typeof p === "string" && ALL_PLATFORMS.includes(p as SocialPlatform));
    if (filtered.length === 0) return { valid: false, message: "Aucune plateforme valide fournie." };
    platforms = filtered.slice(0, MAX_PLATFORMS_GLOBAL);
  }

  const period = VALID_PERIODS.includes(record.period as (typeof VALID_PERIODS)[number])
    ? (record.period as (typeof VALID_PERIODS)[number])
    : "7d";

  let themeLabels: string[] = [];
  if (record.themeLabels !== undefined) {
    if (!Array.isArray(record.themeLabels) || !record.themeLabels.every((item) => typeof item === "string")) {
      return { valid: false, message: "Thématiques invalides." };
    }
    themeLabels = record.themeLabels.slice(0, MAX_THEME_LABELS).map((label) => label.slice(0, MAX_LABEL_LENGTH));
  }

  return {
    valid: true,
    value: {
      mode,
      focus,
      platforms,
      niche: boundedText(record.niche, MAX_LABEL_LENGTH),
      themeLabels,
      country: boundedText(record.country, 10),
      language: boundedText(record.language, 20),
      period,
    },
  };
}
