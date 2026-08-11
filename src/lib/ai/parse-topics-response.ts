import { ALL_CONTENT_TYPES, matchContentTypeLabel, type ContentType } from "@/lib/content-types";

export interface ParsedTopicIdea {
  title: string;
  angle: string;
  description: string;
  niche: string;
  theme: string;
  contentType: ContentType;
  format: string;
  objective: string;
  platform: string;
}

export interface ParsedTopicGroup {
  themeId: string;
  ideas: ParsedTopicIdea[];
  rejectedCount: number;
}

const MAX_FIELD_LENGTH = 500;

function boundedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, MAX_FIELD_LENGTH);
}

/**
 * Valide strictement la réponse de Claude avant tout usage. Règle explicite (jamais de
 * correction silencieuse) : une idée dont le champ `theme` contient en réalité un libellé de
 * type de contenu (« Conseil », « Preuve », « Offre »…) est rejetée de la liste — jamais
 * enregistrée, jamais renommée automatiquement. Le nombre de rejets est renvoyé pour
 * information (jamais masqué à l'appelant).
 */
export function parseTopicsResponse(rawText: string, expectedThemeIds: string[]): ParsedTopicGroup[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const groupsRaw = (parsed as Record<string, unknown>).groups;
  if (!Array.isArray(groupsRaw)) return null;

  const groups: ParsedTopicGroup[] = [];
  for (const groupRaw of groupsRaw) {
    if (typeof groupRaw !== "object" || groupRaw === null) continue;
    const groupRecord = groupRaw as Record<string, unknown>;
    const themeId = groupRecord.themeId;
    if (typeof themeId !== "string" || !expectedThemeIds.includes(themeId)) continue;

    const ideasRaw = groupRecord.ideas;
    if (!Array.isArray(ideasRaw)) {
      groups.push({ themeId, ideas: [], rejectedCount: 0 });
      continue;
    }

    const ideas: ParsedTopicIdea[] = [];
    let rejectedCount = 0;
    for (const ideaRaw of ideasRaw) {
      if (typeof ideaRaw !== "object" || ideaRaw === null) {
        rejectedCount += 1;
        continue;
      }
      const ideaRecord = ideaRaw as Record<string, unknown>;
      const title = boundedString(ideaRecord.title);
      const angle = boundedString(ideaRecord.angle) ?? "";
      const description = boundedString(ideaRecord.description) ?? "";
      const niche = boundedString(ideaRecord.niche) ?? "";
      const theme = boundedString(ideaRecord.theme);
      const format = boundedString(ideaRecord.format) ?? "";
      const objective = boundedString(ideaRecord.objective) ?? "";
      const platform = boundedString(ideaRecord.platform) ?? "";
      const contentTypeRaw = ideaRecord.contentType;

      if (!title || !theme) {
        rejectedCount += 1;
        continue;
      }
      // Règle explicite : un type de contenu ne doit jamais apparaître comme thématique.
      if (matchContentTypeLabel(theme) || (ALL_CONTENT_TYPES as string[]).includes(theme.toLowerCase())) {
        rejectedCount += 1;
        continue;
      }
      if (typeof contentTypeRaw !== "string" || !ALL_CONTENT_TYPES.includes(contentTypeRaw as ContentType)) {
        rejectedCount += 1;
        continue;
      }

      ideas.push({ title, angle, description, niche, theme, contentType: contentTypeRaw as ContentType, format, objective, platform });
    }

    groups.push({ themeId, ideas, rejectedCount });
  }

  return groups;
}
