import type { Topic, TopicVarietyLevel } from "@/types/topic-batch";

interface TopicTemplateContext {
  themeLabel: string;
  item: string;
  angle: string;
  objective?: string;
  targetAudience?: string;
}

type TopicTemplate = (ctx: TopicTemplateContext) => string;

const BASE_TEMPLATES: TopicTemplate[] = [
  ({ themeLabel, item }) => `${themeLabel} : ${item}`,
  ({ themeLabel, item }) => `${themeLabel} — ce qu'il faut savoir sur ${item}`,
  ({ themeLabel, item }) => `${item} et ${themeLabel.toLowerCase()}`,
  ({ themeLabel, item }) => `3 idées reçues sur ${themeLabel.toLowerCase()} à propos de ${item}`,
  ({ themeLabel, item }) => `${themeLabel} : le guide pratique pour ${item}`,
  ({ themeLabel, item }) => `Pourquoi ${themeLabel.toLowerCase()} change la donne pour ${item}`,
  ({ themeLabel, item }) => `Comment ${item} tire parti de ${themeLabel.toLowerCase()}`,
  ({ themeLabel, item, targetAudience }) =>
    targetAudience
      ? `${themeLabel} pour ${targetAudience} : ${item}`
      : `${themeLabel} expliqué à travers ${item}`,
];

const ANGLE_TEMPLATES: TopicTemplate[] = [
  ({ themeLabel, item, angle }) => `${item} — ${angle} en ${themeLabel.toLowerCase()}`,
  ({ themeLabel, item, angle }) => `${themeLabel} : ${item} (${angle})`,
  ({ themeLabel, item, angle }) => `${angle} : ${item} et ${themeLabel.toLowerCase()}`,
  ({ themeLabel, item, angle, objective }) =>
    objective
      ? `${item} ${angle} pour ${objective.toLowerCase()}`
      : `Ce que dit ${themeLabel.toLowerCase()} sur ${item} — ${angle}`,
  ({ themeLabel, item, angle }) => `${item} : guide ${angle} pour ${themeLabel.toLowerCase()}`,
];

const ANGLES = [
  "en pratique",
  "pour débutants",
  "étape par étape",
  "cette année",
  "en cas concret",
  "erreurs à éviter",
  "en checklist",
  "tendances à suivre",
  "mythe ou réalité",
  "en chiffres",
];

const VARIETY_TEMPLATES: Record<TopicVarietyLevel, TopicTemplate[]> = {
  low: BASE_TEMPLATES.slice(0, 4),
  medium: BASE_TEMPLATES,
  high: [...BASE_TEMPLATES, ...ANGLE_TEMPLATES],
};

export interface TopicGenerationParams {
  themeLabel: string;
  items: string[];
  objective?: string;
  targetAudience?: string;
  varietyLevel?: TopicVarietyLevel;
}

function normalizeItems(items: string[]): string[] {
  return items.length > 0 ? items : ["ce sujet"];
}

/**
 * Génération simulée, déterministe (aucun Math.random/appel réseau) — isolée ici pour pouvoir
 * être remplacée plus tard par un appel à une IA réelle sans changer les appelants.
 */
export function generateTopicLabels(params: TopicGenerationParams, count: number, round = 0): string[] {
  const level = params.varietyLevel ?? "medium";
  const templates = VARIETY_TEMPLATES[level];
  const items = normalizeItems(params.items);
  const offset = round * templates.length * items.length;

  return Array.from({ length: count }, (_, i) => {
    const position = i + offset;
    const template = templates[position % templates.length];
    const item = items[Math.floor(position / templates.length) % items.length];
    const angle = ANGLES[Math.floor(position / (templates.length * items.length)) % ANGLES.length];
    return template({
      themeLabel: params.themeLabel,
      item,
      angle,
      objective: params.objective,
      targetAudience: params.targetAudience,
    });
  });
}

export function normalizeTopicLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Retourne, pour chaque sujet en doublon, l'id du premier sujet portant le même libellé normalisé. */
export function detectDuplicateTopicIds(topics: Topic[]): Record<string, string> {
  const seen = new Map<string, string>();
  const duplicates: Record<string, string> = {};
  for (const topic of topics) {
    const key = normalizeTopicLabel(topic.label);
    if (key.length === 0) continue;
    const firstId = seen.get(key);
    if (firstId) {
      duplicates[topic.id] = firstId;
    } else {
      seen.set(key, topic.id);
    }
  }
  return duplicates;
}
