import { nextVersionNumber } from "@/lib/content-versions";
import type { BrandProfile } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type {
  CarouselBody,
  ContentVersion,
  ImageBody,
  LongFormBody,
  ShortVideoBody,
  StoryBody,
  TextBody,
} from "@/types/content-version";
import type { Idea } from "@/types/idea";
import type { Theme } from "@/types/theme";

export type GenerationTone = "professional" | "friendly" | "enthusiastic" | "direct";
export type GenerationLength = "short" | "medium" | "long";
export type TextSection = "hook" | "intro" | "body" | "conclusion" | "cta" | "hashtags" | "firstComment";

export interface AIGenerationContext {
  idea: Idea;
  brand: BrandProfile;
  theme?: Theme;
  tone: GenerationTone;
  length: GenerationLength;
  instructions?: string;
}

export const TONE_LABEL: Record<GenerationTone, string> = {
  professional: "Professionnel",
  friendly: "Chaleureux",
  enthusiastic: "Enthousiaste",
  direct: "Direct",
};

export const LENGTH_LABEL: Record<GenerationLength, string> = {
  short: "Courte",
  medium: "Moyenne",
  long: "Longue",
};

type GeneratedBody =
  | { format: "text"; body: TextBody }
  | { format: "carousel"; body: CarouselBody }
  | { format: "short_video"; body: ShortVideoBody }
  | { format: "story"; body: StoryBody }
  | { format: "image"; body: ImageBody }
  | { format: "article"; body: LongFormBody };

function seedFromString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_000_007;
  }
  return Math.abs(hash);
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function topicLabel(context: AIGenerationContext): string {
  return context.idea.title || context.theme?.label || context.brand.name;
}

function itemLabel(context: AIGenerationContext): string {
  return context.brand.productsAndServices[0] ?? context.brand.name;
}

function ctaLabel(context: AIGenerationContext): string {
  return context.brand.preferredCtas[0] ?? "Découvrez-en plus";
}

const TONE_OPENERS: Record<GenerationTone, string[]> = {
  professional: ["Voici l'essentiel à retenir sur", "Un point clair sur", "Ce qu'il faut savoir sur"],
  friendly: ["On vous explique tout sur", "Parlons un peu de", "Petit tour d'horizon sur"],
  enthusiastic: [
    "On est ravis de vous parler de",
    "Grande nouvelle autour de",
    "Vous allez adorer ce qui suit sur",
  ],
  direct: ["Voici l'info sur", "Droit au but :", "L'essentiel sur"],
};

const TONE_CLOSERS: Record<GenerationTone, string[]> = {
  professional: ["Une approche pensée pour des résultats concrets.", "Une démarche construite, étape par étape."],
  friendly: ["On a hâte de lire vos retours !", "Dites-nous ce que vous en pensez."],
  enthusiastic: ["On ne pouvait pas garder ça pour nous !", "L'aventure ne fait que commencer."],
  direct: ["Simple, efficace, sans détour.", "C'est aussi simple que ça."],
};

const LENGTH_SENTENCES: Record<GenerationLength, number> = { short: 1, medium: 2, long: 3 };
const LENGTH_SLIDES: Record<GenerationLength, number> = { short: 3, medium: 5, long: 7 };
const LENGTH_SCENES: Record<GenerationLength, number> = { short: 2, medium: 4, long: 6 };
const LENGTH_SCREENS: Record<GenerationLength, number> = { short: 2, medium: 3, long: 5 };
const LENGTH_SECTIONS: Record<GenerationLength, number> = { short: 2, medium: 3, long: 5 };

function bodySentence(context: AIGenerationContext, index: number): string {
  const angle = context.idea.angle || context.idea.objective || `l'importance de ${itemLabel(context)}`;
  const templates = [
    `${angle}, expliqué simplement pour ${context.idea.targetAudience || "votre audience"}.`,
    `Un aperçu concret autour de ${itemLabel(context).toLowerCase()} et de ${topicLabel(context).toLowerCase()}.`,
    `Ce que ${context.brand.name} retient de son expérience sur ce sujet.`,
  ];
  return pick(templates, seedFromString(context.idea.id), index);
}

function slugTag(value: string): string {
  const clean = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");
  return clean ? `#${clean}` : "";
}

function buildHashtags(context: AIGenerationContext): string[] {
  const tags = [slugTag(context.brand.name), context.theme ? slugTag(context.theme.label) : "", slugTag(topicLabel(context))];
  return Array.from(new Set(tags.filter((tag) => tag.length > 1))).slice(0, 5);
}

export function buildInstructionsSummary(context: AIGenerationContext): string {
  const parts = [`Ton : ${TONE_LABEL[context.tone]}`, `Longueur : ${LENGTH_LABEL[context.length]}`];
  if (context.instructions?.trim()) parts.push(context.instructions.trim());
  return parts.join(" · ");
}

function generateTextBody(context: AIGenerationContext): TextBody {
  const seed = seedFromString(context.idea.id);
  const sentenceCount = LENGTH_SENTENCES[context.length];
  return {
    hook: `${pick(TONE_OPENERS[context.tone], seed)} ${topicLabel(context).toLowerCase()}`,
    intro: context.idea.contentPlan || `Aujourd'hui, on aborde ${topicLabel(context).toLowerCase()}.`,
    body: Array.from({ length: sentenceCount }, (_, i) => bodySentence(context, i)).join(" "),
    examples: context.idea.keyPoints,
    conclusion: pick(TONE_CLOSERS[context.tone], seed, 1),
    cta: ctaLabel(context),
    hashtags: buildHashtags(context),
    firstComment: context.idea.firstComment || "Racontez-nous votre expérience en commentaire !",
  };
}

function generateCarouselBody(context: AIGenerationContext): CarouselBody {
  const seed = seedFromString(context.idea.id);
  const slideCount = LENGTH_SLIDES[context.length];
  const points = context.idea.keyPoints && context.idea.keyPoints.length > 0 ? context.idea.keyPoints : null;
  const slides = Array.from({ length: slideCount }, (_, i) => ({
    title: points?.[i] ?? `Point ${i + 1}`,
    text: points?.[i] ?? bodySentence(context, i),
  }));
  return {
    coverTitle: topicLabel(context),
    hook: `${pick(TONE_OPENERS[context.tone], seed)} ${topicLabel(context).toLowerCase()}`,
    slides,
    conclusion: pick(TONE_CLOSERS[context.tone], seed, 1),
    cta: ctaLabel(context),
    caption: context.idea.contentPlan || `Un carrousel sur ${topicLabel(context).toLowerCase()}.`,
    hashtags: buildHashtags(context),
  };
}

function generateShortVideoBody(context: AIGenerationContext): ShortVideoBody {
  const seed = seedFromString(context.idea.id);
  const sceneCount = LENGTH_SCENES[context.length];
  const scenes = Array.from({ length: sceneCount }, (_, i) => ({
    text: bodySentence(context, i),
    onScreenText: i === 0 ? topicLabel(context) : undefined,
  }));
  return {
    hook: `${pick(TONE_OPENERS[context.tone], seed)} ${topicLabel(context).toLowerCase()}`,
    script: scenes.map((scene) => scene.text).join(" "),
    scenes,
    durationSeconds: sceneCount * 5,
    cta: ctaLabel(context),
    caption: context.idea.contentPlan || topicLabel(context),
    hashtags: buildHashtags(context),
  };
}

function generateStoryBody(context: AIGenerationContext): StoryBody {
  const screenCount = LENGTH_SCREENS[context.length];
  const screens = Array.from({ length: screenCount }, (_, i) => ({
    text: bodySentence(context, i),
    visualHint: i === 0 ? "Visuel d'ouverture" : undefined,
  }));
  return {
    screens,
    interaction: context.tone === "friendly" ? "question" : "none",
    cta: ctaLabel(context),
  };
}

function generateImageBody(context: AIGenerationContext): ImageBody {
  return {
    concept: `Visuel mettant en avant ${itemLabel(context).toLowerCase()}, en lien avec ${topicLabel(context).toLowerCase()}.`,
    onImageText: topicLabel(context),
    caption: bodySentence(context, 0),
    cta: ctaLabel(context),
    hashtags: buildHashtags(context),
  };
}

function generateLongFormBody(context: AIGenerationContext): LongFormBody {
  const seed = seedFromString(context.idea.id);
  const sectionCount = LENGTH_SECTIONS[context.length];
  const points = context.idea.keyPoints && context.idea.keyPoints.length > 0 ? context.idea.keyPoints : null;
  const sections = Array.from({ length: sectionCount }, (_, i) => ({
    heading: points?.[i] ?? `Partie ${i + 1}`,
    text: bodySentence(context, i),
  }));
  return {
    title: topicLabel(context),
    intro: context.idea.contentPlan || `${pick(TONE_OPENERS[context.tone], seed)} ${topicLabel(context).toLowerCase()}.`,
    plan: sections.map((section) => section.heading),
    sections,
    conclusion: pick(TONE_CLOSERS[context.tone], seed, 1),
    cta: ctaLabel(context),
    socialSummary: bodySentence(context, 0),
  };
}

export function generateContentBody(format: ContentFormat, context: AIGenerationContext): GeneratedBody {
  switch (format) {
    case "carousel":
      return { format, body: generateCarouselBody(context) };
    case "short_video":
      return { format, body: generateShortVideoBody(context) };
    case "story":
      return { format, body: generateStoryBody(context) };
    case "image":
      return { format, body: generateImageBody(context) };
    case "article":
      return { format, body: generateLongFormBody(context) };
    case "text":
    default:
      return { format: "text", body: generateTextBody(context) };
  }
}

/** Construit une version IA complète (nouveau id, numéro de version, `source: "ai"`). */
export function buildAIVersion(
  context: AIGenerationContext,
  format: ContentFormat,
  versions: ContentVersion[],
  name?: string
): ContentVersion {
  const generated = generateContentBody(format, context);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ideaId: context.idea.id,
    versionNumber: nextVersionNumber(versions),
    name,
    source: "ai",
    instructions: buildInstructionsSummary(context),
    createdAt: now,
    updatedAt: now,
    isCurrent: true,
    ...generated,
  };
}

export function regenerateTextSection(body: TextBody, section: TextSection, context: AIGenerationContext): TextBody {
  const seed = seedFromString(body.hook + section) + 1;
  switch (section) {
    case "hook":
      return { ...body, hook: `${pick(TONE_OPENERS[context.tone], seed)} ${topicLabel(context).toLowerCase()}` };
    case "intro":
      return { ...body, intro: context.idea.contentPlan || bodySentence(context, seed % 3) };
    case "body":
      return {
        ...body,
        body: Array.from({ length: LENGTH_SENTENCES[context.length] }, (_, i) => bodySentence(context, i + seed)).join(
          " "
        ),
      };
    case "conclusion":
      return { ...body, conclusion: pick(TONE_CLOSERS[context.tone], seed) };
    case "cta": {
      const ctas = context.brand.preferredCtas;
      return { ...body, cta: ctas.length > 0 ? ctas[seed % ctas.length] : ctaLabel(context) };
    }
    case "hashtags":
      return { ...body, hashtags: buildHashtags(context) };
    case "firstComment":
      return { ...body, firstComment: "Dites-nous ce que vous en pensez en commentaire !" };
    default:
      return body;
  }
}

export function shortenText(body: TextBody): TextBody {
  const truncate = (text: string, maxSentences: number) => {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    return sentences.slice(0, maxSentences).join(" ") || text;
  };
  return {
    ...body,
    intro: truncate(body.intro, 1),
    body: truncate(body.body, 1),
    hashtags: body.hashtags.slice(0, 3),
  };
}

export function expandText(body: TextBody, context: AIGenerationContext): TextBody {
  return {
    ...body,
    body: `${body.body} ${bodySentence(context, seedFromString(body.body) % 5)}`,
    examples: [...(body.examples ?? []), `Point complémentaire sur ${topicLabel(context).toLowerCase()}.`],
  };
}

export function simplifyText(body: TextBody): TextBody {
  const simplify = (text: string) => text.split(/\s+/).slice(0, 40).join(" ");
  return { ...body, body: simplify(body.body), intro: simplify(body.intro) };
}

export function changeTone(body: TextBody, tone: GenerationTone, context: AIGenerationContext): TextBody {
  const seed = seedFromString(body.hook) + 3;
  return {
    ...body,
    hook: `${pick(TONE_OPENERS[tone], seed)} ${topicLabel(context).toLowerCase()}`,
    conclusion: pick(TONE_CLOSERS[tone], seed),
  };
}

const PLATFORM_MAX_HASHTAGS: Record<SocialPlatform, number> = {
  instagram: 8,
  tiktok: 5,
  x: 2,
  linkedin: 3,
  facebook: 3,
  youtube: 4,
};

export function adaptForPlatform(body: TextBody, platform: SocialPlatform): TextBody {
  return { ...body, hashtags: body.hashtags.slice(0, PLATFORM_MAX_HASHTAGS[platform]) };
}
