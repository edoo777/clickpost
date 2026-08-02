import type { ContentType, ContentTypeDistribution } from "@/lib/content-types";
import { expandDistribution } from "@/lib/content-types";
import type { GenerationTone } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";
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

/**
 * Signale (sans jamais supprimer) les sujets dont le libellé correspond déjà à une idée
 * existante dans le workspace — comparaison best-effort par libellé normalisé, jamais bloquante.
 */
export function detectExistingIdeaMatches(topics: Topic[], existingIdeas: Idea[]): Record<string, string> {
  const byLabel = new Map<string, string>();
  for (const idea of existingIdeas) {
    const key = normalizeTopicLabel(idea.title);
    if (key.length === 0 || byLabel.has(key)) continue;
    byLabel.set(key, idea.id);
  }
  const matches: Record<string, string> = {};
  for (const topic of topics) {
    const matchId = byLabel.get(normalizeTopicLabel(topic.label));
    if (matchId) matches[topic.id] = matchId;
  }
  return matches;
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

/** Taille de lot par défaut d'un appel de génération — voir section 3/4 de la spécification
 * « Boîte à idées » : 20 idées par appel Claude par défaut, jamais une grosse demande en un seul
 * appel (fiabilité). */
export const DEFAULT_LOT_SIZE = 20;
export const MAX_REQUESTED_PER_THEME = 100;
export const MAX_TOTAL_REQUESTED_PER_GENERATION = 200;

/** Découpe un total en une suite de tailles de lot ≤ lotSize (dernier lot = le reste). */
export function splitIntoLotSizes(total: number, lotSize: number = DEFAULT_LOT_SIZE): number[] {
  const sizes: number[] = [];
  let remaining = Math.max(0, Math.floor(total));
  while (remaining > 0) {
    const size = Math.min(lotSize, remaining);
    sizes.push(size);
    remaining -= size;
  }
  return sizes;
}

/** Répartit une distribution de types de contenu sur des lots de tailles données, en conservant
 * exactement le total d'origine (aucune idée ajoutée ou perdue par le découpage). */
export function splitDistributionIntoLots(
  distribution: ContentTypeDistribution[],
  lotSizes: number[]
): ContentTypeDistribution[][] {
  const flat = expandDistribution(distribution);
  const lots: ContentTypeDistribution[][] = [];
  let cursor = 0;
  for (const size of lotSizes) {
    const slice = flat.slice(cursor, cursor + size);
    cursor += size;
    const counts = new Map<ContentType, number>();
    for (const contentType of slice) counts.set(contentType, (counts.get(contentType) ?? 0) + 1);
    lots.push(Array.from(counts.entries()).map(([contentType, count]) => ({ contentType, count })));
  }
  return lots;
}

export interface ThemeGenerationRequest {
  /** UUID toujours présent : identifiant réel de la thématique, ou identifiant de corrélation
   * généré côté client pour une thématique ponctuelle (jamais écrit dans topic_batches.theme_id
   * ni dans la table themes tant que l'utilisateur n'a pas confirmé son ajout). */
  themeId: string;
  /** true = thématique ponctuelle non enregistrée dans les paramètres de la marque. */
  isAdhoc: boolean;
  themeLabel: string;
  requestedCount: number;
  distribution: ContentTypeDistribution[];
}

export interface ThemeGenerationResult {
  themeId: string;
  topics: GeneratedTopic[];
  source: "claude" | "simulated";
  rejectedCount: number;
  /** Repli délibéré (intégration non configurée côté serveur) — jamais une erreur transitoire. */
  fallbackReason?: string;
}

export interface LotFailure {
  message: string;
}

/** État d'avancement d'un lot pour l'affichage de progression par thématique — vit côté
 * composant (TopicGeneratorView), jamais persisté : une fois la génération terminée, seuls les
 * Topic/TopicBatch produits sont enregistrés, comme aujourd'hui. */
export interface LotStatus {
  index: number;
  size: number;
  status: "pending" | "generating" | "success" | "error";
  errorMessage?: string;
}

export type LotOutcome = { result: ThemeGenerationResult } | { failure: LotFailure };

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

function simulateTheme(request: ThemeGenerationRequest, shared: SharedGenerationParams, round: number, fallbackReason?: string): ThemeGenerationResult {
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
  return { themeId: request.themeId, topics, source: "simulated", rejectedCount: 0, fallbackReason };
}

/**
 * Génère un seul lot (≤ DEFAULT_LOT_SIZE idées) pour une seule thématique. Primitive unique de
 * génération du Générateur d'idées — toute orchestration (plusieurs lots, plusieurs thématiques,
 * reprise d'un lot en erreur) est bâtie au-dessus de cette fonction, jamais dupliquée ailleurs.
 *
 * Distinction volontaire entre deux natures d'échec :
 * - intégration non configurée côté serveur (503 "not_configured") → repli simulé silencieux,
 *   c'est le mode démonstration attendu en développement ;
 * - toute autre erreur (réseau, limite de requêtes, réponse invalide…) → échec explicite du lot,
 *   jamais remplacé silencieusement par du contenu simulé — l'appelant doit pouvoir proposer
 *   « Reprendre ce lot » plutôt que de masquer l'échec.
 */
export async function generateTopicsLot(
  brandId: string,
  request: ThemeGenerationRequest,
  shared: SharedGenerationParams,
  round = 0
): Promise<LotOutcome> {
  const standalone = !brandId;
  try {
    const response = await fetch("/api/ia/generateur/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: standalone ? undefined : brandId,
        standalone,
        niche: standalone ? shared.niche : undefined,
        themes: [
          {
            themeId: request.themeId,
            isAdhoc: request.isAdhoc,
            themeLabel: request.themeLabel,
            requestedCount: request.requestedCount,
            distribution: Object.fromEntries(request.distribution.map((entry) => [entry.contentType, entry.count])),
          },
        ],
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
      if (data?.code === "not_configured") {
        return { result: simulateTheme(request, shared, round, "not_configured") };
      }
      return { failure: { message: data?.message ?? `Erreur serveur (${response.status}).` } };
    }

    const group = data.groups.find((candidate) => candidate.themeId === request.themeId);
    if (!group || group.ideas.length === 0) {
      return { failure: { message: "Claude n'a renvoyé aucune idée exploitable pour ce lot." } };
    }

    return {
      result: {
        themeId: request.themeId,
        topics: group.ideas.map((idea) => ({ label: idea.title, contentType: idea.contentType })),
        source: "claude",
        rejectedCount: group.rejectedCount,
      },
    };
  } catch {
    return { failure: { message: "Connexion impossible — vérifiez votre réseau." } };
  }
}
