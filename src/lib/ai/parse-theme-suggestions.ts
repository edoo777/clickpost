import { matchContentTypeLabel } from "@/lib/content-types";

export interface ThemeSuggestion {
  name: string;
  description: string;
}

const MAX_FIELD_LENGTH = 300;
const MAX_SUGGESTIONS = 15;

function boundedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, MAX_FIELD_LENGTH);
}

/** Valide strictement les suggestions renvoyées par Claude — rejette toute suggestion dont le
 * nom est en réalité un type de contenu (Conseil, Preuve, Offre…), jamais enregistrée. */
export function parseThemeSuggestions(rawText: string): ThemeSuggestion[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const suggestionsRaw = (parsed as Record<string, unknown>).suggestions;
  if (!Array.isArray(suggestionsRaw)) return null;

  const suggestions: ThemeSuggestion[] = [];
  for (const entry of suggestionsRaw) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const name = boundedString(record.name);
    const description = boundedString(record.description) ?? "";
    if (!name) continue;
    if (matchContentTypeLabel(name)) continue;
    suggestions.push({ name, description });
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }
  return suggestions;
}
