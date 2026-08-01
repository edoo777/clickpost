import type { ContentType, ContentTypeDistribution } from "@/lib/content-types";
import type { GenerationTone } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
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
 * être remplacée plus tard par un appel à une IA réelle sans changer les appelants. Moteur
 * unique, réutilisé par generateTopicsWithContentTypes ci-dessous (aucun second moteur créé).
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

export interface GeneratedTopic {
  label: string;
  contentType?: ContentType;
}

/** Attache un type de contenu à chaque sujet généré, dans l'ordre de la répartition demandée —
 * réutilise generateTopicLabels tel quel, ne duplique pas la génération. */
export function generateTopicsWithContentTypes(
  params: TopicGenerationParams,
  contentTypeSequence: ContentType[],
  round = 0
): GeneratedTopic[] {
  const labels = generateTopicLabels(params, contentTypeSequence.length, round);
  return labels.map((label, index) => ({ label, contentType: contentTypeSequence[index] }));
}

export interface ThemeGenerationRequest {
  themeId: string;
  themeLabel: string;
  requestedCount: number;
  distribution: ContentTypeDistribution[];
}

export interface ThemeGenerationResult {
  themeId: string;
  topics: GeneratedTopic[];
  source: "claude" | "simulated";
  rejectedCount: number;
  fallbackReason?: string;
}

export interface SharedGenerationParams {
  items: string[];
  niche: string;
  objective?: string;
  targetAudience?: string;
  tone?: GenerationTone;
  formats: ContentFormat[];
  platforms: SocialPlatform[];
  instructions?: string;
  varietyLevel?: TopicVarietyLevel;
}

interface TopicsApiSuccessGroup {
  themeId: string;
  ideas: { title: string; contentType: ContentType }[];
  rejectedCount: number;
}
interface TopicsApiSuccess {
  status: "ok";
  groups: TopicsApiSuccessGroup[];
}
interface TopicsApiError {
  status: "error";
  code: string;
  message: string;
}
type TopicsApiResponse = TopicsApiSuccess | TopicsApiError;

function simulateAllThemes(
  brandId: string,
  themeRequests: ThemeGenerationRequest[],
  shared: SharedGenerationParams,
  round: number,
  fallbackReason?: string
): ThemeGenerationResult[] {
  return themeRequests.map((request) => {
    const contentTypeSequence = request.distribution.flatMap((entry) =>
      Array<ContentType>(Math.max(0, entry.count)).fill(entry.contentType)
    );
    const topics = generateTopicsWithContentTypes(
      {
        themeLabel: request.themeLabel,
        items: shared.items,
        objective: shared.objective,
        targetAudience: shared.targetAudience,
        varietyLevel: shared.varietyLevel,
      },
      contentTypeSequence,
      round
    );
    return { themeId: request.themeId, topics, source: "simulated" as const, rejectedCount: 0, fallbackReason };
  });
}

/**
 * Point d'entrée du Générateur d'idées pour une génération multi-thématiques. Tente un appel
 * Claude réel — un seul appel pour toutes les thématiques sélectionnées, jamais un par
 * thématique (pour rester sous la limite de requêtes partagée avec l'Atelier) — uniquement
 * lorsqu'appelée depuis un clic explicite sur « Générer les idées ». En cas d'échec quelconque
 * (non configuré, quota, erreur, réponse invalide), retombe entièrement sur le moteur simulé
 * existant, pour toutes les thématiques de cette génération.
 */
export async function generateTopicsForThemes(
  brandId: string,
  themeRequests: ThemeGenerationRequest[],
  shared: SharedGenerationParams,
  round = 0
): Promise<ThemeGenerationResult[]> {
  try {
    const response = await fetch("/api/ia/generateur/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        themes: themeRequests.map((request) => ({
          themeId: request.themeId,
          requestedCount: request.requestedCount,
          distribution: Object.fromEntries(request.distribution.map((entry) => [entry.contentType, entry.count])),
        })),
        formats: shared.formats,
        platforms: shared.platforms,
        objective: shared.objective ?? "",
        targetAudience: shared.targetAudience ?? "",
        tone: shared.tone ?? "professional",
        instructions: shared.instructions ?? "",
      }),
    });
    const data = (await response.json().catch(() => null)) as TopicsApiResponse | null;
    if (!data || data.status !== "ok") {
      return simulateAllThemes(brandId, themeRequests, shared, round, data?.status === "error" ? data.code : `http_${response.status}`);
    }

    return themeRequests.map((request) => {
      const group = data.groups.find((candidate) => candidate.themeId === request.themeId);
      if (!group || group.ideas.length === 0) {
        return simulateAllThemes(brandId, [request], shared, round, "empty_group")[0];
      }
      return {
        themeId: request.themeId,
        topics: group.ideas.map((idea) => ({ label: idea.title, contentType: idea.contentType })),
        source: "claude" as const,
        rejectedCount: group.rejectedCount,
      };
    });
  } catch {
    return simulateAllThemes(brandId, themeRequests, shared, round, "network_error");
  }
}
