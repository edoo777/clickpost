import type { GenerationTone } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export type PromptCategory = "start" | "improve" | "finish" | "adapt" | "tone";

export const PROMPT_CATEGORY_LABEL: Record<PromptCategory, string> = {
  start: "Commencer",
  improve: "Améliorer",
  finish: "Finaliser",
  adapt: "Adapter",
  tone: "Ton",
};

/**
 * Action interne servant à faire correspondre chaque modèle à la fonction de génération qui le
 * traite (dans SimulatedContentGenerationProvider). Ne fait pas partie des champs minimaux
 * demandés pour un modèle mais reste nécessaire au fonctionnement — un futur fournisseur IA
 * distant pourrait l'ignorer et se fier uniquement à `instruction`.
 */
export type PromptAction =
  | "full_generation"
  | "hooks"
  | "plan"
  | "angles"
  | "clarify"
  | "shorten"
  | "expand"
  | "correct_french"
  | "simplify"
  | "persuasive"
  | "storytelling"
  | "add_examples"
  | "add_cta"
  | "conclusion"
  | "add_hashtags"
  | "first_comment"
  | "consistency_check"
  | "adapt_platform"
  | "transform_format"
  | "transform_email"
  | "apply_tone";

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  instruction: string;
  requiredFields: string[];
  supportedFormats: ContentFormat[];
  supportedPlatforms?: SocialPlatform[];
  tone?: GenerationTone;
  order: number;
  active: boolean;
  /** Champs internes de routage — voir le commentaire sur `PromptAction`. */
  action: PromptAction;
  targetPlatform?: SocialPlatform;
  targetFormat?: ContentFormat;
}

const ALL_FORMATS: ContentFormat[] = ["text", "carousel", "image", "short_video", "story", "article"];
const TEXT_ONLY: ContentFormat[] = ["text"];

/**
 * Registre central des modèles de prompts affichés dans l'Assistant de rédaction. Aucun autre
 * composant ne doit définir de commande IA ailleurs — l'ajout d'une nouvelle commande se fait ici.
 * Préparé pour être personnalisable par l'utilisateur, enregistré en favoris, étendu par une
 * agence ou relié à une vraie API plus tard (voir `content-generation-provider.ts`).
 */
export const PROMPT_PRESETS: PromptPreset[] = [
  // Commencer
  {
    id: "develop-idea",
    name: "Développer cette idée",
    description: "Génère un contenu complet à partir du sujet, de l'angle et du contexte de la marque.",
    category: "start",
    instruction: "Développe cette idée en un contenu complet, cohérent avec la marque.",
    requiredFields: [],
    supportedFormats: ALL_FORMATS,
    order: 1,
    active: true,
    action: "full_generation",
  },
  {
    id: "generate-hooks",
    name: "Générer 5 hooks",
    description: "Propose cinq accroches distinctes parmi lesquelles choisir.",
    category: "start",
    instruction: "Génère cinq accroches distinctes pour ce contenu.",
    requiredFields: [],
    supportedFormats: TEXT_ONLY,
    order: 2,
    active: true,
    action: "hooks",
  },
  {
    id: "create-plan",
    name: "Créer un plan",
    description: "Structure le contenu en quelques points clés avant la rédaction.",
    category: "start",
    instruction: "Propose un plan en plusieurs points pour structurer ce contenu.",
    requiredFields: [],
    supportedFormats: TEXT_ONLY,
    order: 3,
    active: true,
    action: "plan",
  },
  {
    id: "propose-angles",
    name: "Proposer 3 angles différents",
    description: "Suggère trois façons distinctes d'aborder le sujet.",
    category: "start",
    instruction: "Propose trois angles de traitement différents pour ce sujet.",
    requiredFields: [],
    supportedFormats: TEXT_ONLY,
    order: 4,
    active: true,
    action: "angles",
  },

  // Améliorer
  {
    id: "clarify",
    name: "Rendre plus clair",
    description: "Simplifie la formulation pour une lecture plus fluide.",
    category: "improve",
    instruction: "Reformule ce contenu pour le rendre plus clair.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 1,
    active: true,
    action: "clarify",
  },
  {
    id: "shorten",
    name: "Raccourcir",
    description: "Réduit le texte à l'essentiel.",
    category: "improve",
    instruction: "Raccourcis ce contenu en gardant l'essentiel.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 2,
    active: true,
    action: "shorten",
  },
  {
    id: "expand",
    name: "Développer davantage",
    description: "Ajoute du détail et de la profondeur au contenu actuel.",
    category: "improve",
    instruction: "Développe ce contenu avec davantage de détails.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 3,
    active: true,
    action: "expand",
  },
  {
    id: "correct-french",
    name: "Corriger le français",
    description: "Nettoie la ponctuation et les espacements du texte.",
    category: "improve",
    instruction: "Corrige les fautes et la ponctuation de ce contenu.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 4,
    active: true,
    action: "correct_french",
  },
  {
    id: "simplify",
    name: "Simplifier",
    description: "Va à l'essentiel en réduisant la longueur des phrases.",
    category: "improve",
    instruction: "Simplifie ce contenu.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 5,
    active: true,
    action: "simplify",
  },
  {
    id: "persuasive",
    name: "Rendre plus convaincant",
    description: "Renforce l'argumentaire et l'appel à l'action.",
    category: "improve",
    instruction: "Rends ce contenu plus convaincant.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 6,
    active: true,
    action: "persuasive",
  },
  {
    id: "storytelling",
    name: "Ajouter du storytelling",
    description: "Ouvre le contenu par une accroche narrative.",
    category: "improve",
    instruction: "Ajoute une dimension storytelling à ce contenu.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 7,
    active: true,
    action: "storytelling",
  },
  {
    id: "add-examples",
    name: "Ajouter des exemples",
    description: "Illustre le propos avec un exemple concret.",
    category: "improve",
    instruction: "Ajoute un exemple concret à ce contenu.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 8,
    active: true,
    action: "add_examples",
  },

  // Finaliser
  {
    id: "add-cta",
    name: "Ajouter un CTA",
    description: "Choisit un appel à l'action adapté à la marque.",
    category: "finish",
    instruction: "Ajoute un appel à l'action adapté.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 1,
    active: true,
    action: "add_cta",
  },
  {
    id: "create-conclusion",
    name: "Créer une conclusion",
    description: "Génère une phrase de clôture cohérente avec le ton choisi.",
    category: "finish",
    instruction: "Rédige une conclusion pour ce contenu.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 2,
    active: true,
    action: "conclusion",
  },
  {
    id: "add-hashtags",
    name: "Ajouter des hashtags",
    description: "Propose une sélection de hashtags pertinents.",
    category: "finish",
    instruction: "Propose des hashtags pertinents.",
    requiredFields: [],
    supportedFormats: TEXT_ONLY,
    order: 3,
    active: true,
    action: "add_hashtags",
  },
  {
    id: "first-comment",
    name: "Proposer un premier commentaire",
    description: "Rédige un premier commentaire pour relancer l'engagement.",
    category: "finish",
    instruction: "Propose un premier commentaire.",
    requiredFields: [],
    supportedFormats: TEXT_ONLY,
    order: 4,
    active: true,
    action: "first_comment",
  },
  {
    id: "check-consistency",
    name: "Vérifier la cohérence",
    description: "Repère les éléments manquants (accroche, CTA, hashtags…).",
    category: "finish",
    instruction: "Vérifie la cohérence de ce contenu.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: 5,
    active: true,
    action: "consistency_check",
  },

  // Adapter
  {
    id: "adapt-linkedin",
    name: "Adapter à LinkedIn",
    description: "Ajuste le contenu aux usages de LinkedIn.",
    category: "adapt",
    instruction: "Adapte ce contenu pour LinkedIn.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    supportedPlatforms: ["linkedin"],
    order: 1,
    active: true,
    action: "adapt_platform",
    targetPlatform: "linkedin",
  },
  {
    id: "adapt-instagram",
    name: "Adapter à Instagram",
    description: "Ajuste le contenu aux usages d'Instagram.",
    category: "adapt",
    instruction: "Adapte ce contenu pour Instagram.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    supportedPlatforms: ["instagram"],
    order: 2,
    active: true,
    action: "adapt_platform",
    targetPlatform: "instagram",
  },
  {
    id: "adapt-facebook",
    name: "Adapter à Facebook",
    description: "Ajuste le contenu aux usages de Facebook.",
    category: "adapt",
    instruction: "Adapte ce contenu pour Facebook.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    supportedPlatforms: ["facebook"],
    order: 3,
    active: true,
    action: "adapt_platform",
    targetPlatform: "facebook",
  },
  {
    id: "adapt-tiktok",
    name: "Adapter à TikTok",
    description: "Ajuste le contenu aux usages de TikTok.",
    category: "adapt",
    instruction: "Adapte ce contenu pour TikTok.",
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    supportedPlatforms: ["tiktok"],
    order: 4,
    active: true,
    action: "adapt_platform",
    targetPlatform: "tiktok",
  },
  {
    id: "transform-carousel",
    name: "Transformer en carrousel",
    description: "Reformate le contenu en diapositives de carrousel.",
    category: "adapt",
    instruction: "Transforme ce contenu en carrousel.",
    requiredFields: [],
    supportedFormats: ALL_FORMATS,
    order: 5,
    active: true,
    action: "transform_format",
    targetFormat: "carousel",
  },
  {
    id: "transform-video",
    name: "Transformer en script vidéo",
    description: "Reformate le contenu en script pour vidéo courte.",
    category: "adapt",
    instruction: "Transforme ce contenu en script de vidéo courte.",
    requiredFields: [],
    supportedFormats: ALL_FORMATS,
    order: 6,
    active: true,
    action: "transform_format",
    targetFormat: "short_video",
  },
  {
    id: "transform-article",
    name: "Transformer en article",
    description: "Reformate le contenu en article structuré.",
    category: "adapt",
    instruction: "Transforme ce contenu en article.",
    requiredFields: [],
    supportedFormats: ALL_FORMATS,
    order: 7,
    active: true,
    action: "transform_format",
    targetFormat: "article",
  },
  {
    id: "transform-email",
    name: "Transformer en courriel",
    description: "Reformate le contenu en courriel (objet, corps, signature).",
    category: "adapt",
    instruction: "Transforme ce contenu en courriel.",
    requiredFields: [],
    supportedFormats: TEXT_ONLY,
    order: 8,
    active: true,
    action: "transform_email",
  },

  // Ton
  ...(
    [
      ["tone-professional", "Professionnel", "professional"],
      ["tone-pedagogical", "Pédagogique", "pedagogical"],
      ["tone-inspiring", "Inspirant", "inspiring"],
      ["tone-direct", "Direct", "direct"],
      ["tone-conversational", "Conversationnel", "conversational"],
      ["tone-expert", "Expert", "expert"],
      ["tone-storytelling", "Storytelling", "storytelling"],
      ["tone-provocative", "Provocateur maîtrisé", "provocative"],
    ] as [string, string, GenerationTone][]
  ).map(([id, name, tone], index) => ({
    id,
    name,
    description: `Réécrit l'accroche et la conclusion sur un ton ${name.toLowerCase()}.`,
    category: "tone" as PromptCategory,
    instruction: `Applique un ton ${name.toLowerCase()} à ce contenu.`,
    requiredFields: ["body"],
    supportedFormats: TEXT_ONLY,
    order: index + 1,
    active: true,
    action: "apply_tone" as PromptAction,
    tone,
  })),
];

export function getPresetsByCategory(category: PromptCategory): PromptPreset[] {
  return PROMPT_PRESETS.filter((preset) => preset.category === category && preset.active).sort(
    (a, b) => a.order - b.order
  );
}

export function getPresetById(id: string): PromptPreset | undefined {
  return PROMPT_PRESETS.find((preset) => preset.id === id);
}
