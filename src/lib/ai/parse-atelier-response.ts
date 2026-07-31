export interface AtelierGeneratedContent {
  hook: string;
  intro: string;
  body: string;
  conclusion: string;
  cta: string;
  hashtags: string[];
}

const MAX_FIELD_LENGTH = 4000;
const MAX_HASHTAGS = 30;

function asBoundedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, MAX_FIELD_LENGTH);
}

/**
 * Valide strictement le texte renvoyé par Claude (censé être un JSON conforme au prompt système)
 * avant qu'il n'atteigne l'application — un modèle réel peut répondre dans un format inattendu,
 * refuser, ou tronquer sa réponse ; rien de ce qui n'est pas explicitement conforme n'est accepté.
 */
export function parseAtelierResponse(rawText: string): AtelierGeneratedContent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;

  const hook = asBoundedString(record.hook);
  const intro = asBoundedString(record.intro);
  const body = asBoundedString(record.body);
  const conclusion = asBoundedString(record.conclusion);
  const cta = asBoundedString(record.cta);
  if (hook === null || intro === null || body === null || conclusion === null || cta === null) return null;

  const hashtagsRaw = record.hashtags;
  if (!Array.isArray(hashtagsRaw)) return null;
  const hashtags = hashtagsRaw.filter((item): item is string => typeof item === "string").slice(0, MAX_HASHTAGS);

  if (!body.trim()) return null;

  return { hook, intro, body, conclusion, cta, hashtags };
}
