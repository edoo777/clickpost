import type { PromptPreset } from "@/lib/prompt-presets";
import type { AIGenerationContext } from "@/lib/assisted-generation";
import type { ContentFormat } from "@/types/editorial-calendar";

export interface AtelierPresetPrompt {
  system: string;
  user: string;
  responseKind: "version" | "text_list" | "report";
}

function joinList(items: string[] | undefined, fallback: string): string {
  if (!items || items.length === 0) return fallback;
  return items.slice(0, 8).join(", ");
}

function buildBrandContext(context: AIGenerationContext): string[] {
  const { brand } = context;
  return [
    `Marque : ${brand.name}`,
    `Secteur : ${brand.industry || "non précisé"}`,
    brand.positioning ? `Positionnement : ${brand.positioning}.` : null,
    brand.valueProposition ? `Proposition de valeur : ${brand.valueProposition}.` : null,
    `Voix de la marque : ${brand.toneOfVoice || "non précisée"}.`,
    `Audience cible : ${brand.targetAudience || "non précisée"}.`,
    brand.audiencePainPoints && brand.audiencePainPoints.length > 0
      ? `Points de douleur : ${joinList(brand.audiencePainPoints, "non précisés")}.`
      : null,
    brand.communicationGoals && brand.communicationGoals.length > 0
      ? `Objectifs de communication : ${joinList(brand.communicationGoals, "non précisés")}.`
      : null,
    brand.priorityTopics && brand.priorityTopics.length > 0
      ? `Thématiques prioritaires : ${joinList(brand.priorityTopics, "non précisées")}.`
      : null,
    `Mots à privilégier : ${joinList(brand.preferredPhrases, "aucun en particulier")}.`,
    `Mots interdits : ${joinList(brand.forbiddenWords, "aucun")}.`,
    `Sujets à éviter : ${joinList(brand.topicsToAvoid, "aucun")}.`,
    `Appels à l'action préférés : ${joinList(brand.preferredCtas, "aucun")}.`,
    brand.productsAndServices && brand.productsAndServices.length > 0
      ? `Produits et services importants : ${joinList(brand.productsAndServices, "non précisés")}.`
      : null,
  ].filter((line): line is string => Boolean(line));
}

function responseSchema(preset: PromptPreset): string {
  if (preset.action === "hooks" || preset.action === "angles") {
    return 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["élément 1","élément 2",...]}.';
  }
  if (preset.action === "consistency_check") {
    return 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"items":["message 1","message 2",...]}.';
  }
  return 'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"hook":"...","intro":"...","body":"...","conclusion":"...","cta":"...","hashtags":["..."]}.';
}

export function buildAtelierPresetPrompt(params: {
  preset: PromptPreset;
  context: AIGenerationContext;
  currentText?: string;
  currentFormat?: ContentFormat;
}): AtelierPresetPrompt {
  const { preset, context, currentText, currentFormat } = params;
  const responseKind: AtelierPresetPrompt["responseKind"] =
    preset.action === "hooks" || preset.action === "angles"
      ? "text_list"
      : preset.action === "consistency_check"
      ? "report"
      : "version";

  const systemLines: string[] = [
    "Tu es un rédacteur publicitaire francophone spécialisé dans les publications pour les réseaux sociaux.",
    "Tu dois exécuter une seule action sur cette idée, en respectant le contexte de marque et les consignes.",
    ...buildBrandContext(context),
    "Respecte le ton demandé et ne propose pas de contenu qui viole les interdits de la marque.",
    `Action à exécuter : ${preset.instruction}`,
    responseSchema(preset),
  ];

  const userLines: Array<string | null> = [
    `Titre de l'idée : ${context.idea.title || "(sans titre)"}`,
    context.idea.description ? `Description : ${context.idea.description}` : null,
    context.idea.angle ? `Angle : ${context.idea.angle}` : null,
    context.idea.objective ? `Objectif : ${context.idea.objective}` : null,
    context.idea.targetAudience ? `Audience visée : ${context.idea.targetAudience}` : null,
    context.theme ? `Thématique éditoriale : ${context.theme.label}${context.theme.objective ? ` (${context.theme.objective})` : ""}` : null,
    currentFormat ? `Format actuel : ${currentFormat}` : null,
    currentText ? `Contenu actuel : ${currentText}` : context.idea.body ? `Contenu existant : ${context.idea.body}` : null,
    context.idea.contentPlan ? `Plan de contenu : ${context.idea.contentPlan}` : null,
    context.idea.keyPoints && context.idea.keyPoints.length > 0
      ? `Points clés : ${joinList(context.idea.keyPoints, "non précisés")}`
      : null,
    `Ton demandé : ${context.tone}`,
    `Longueur souhaitée : ${context.length}`,
    context.instructions ? `Instructions supplémentaires : ${context.instructions}` : null,
  ];

  return {
    system: systemLines.filter((line): line is string => Boolean(line)).join("\n"),
    user: userLines.filter((line): line is string => Boolean(line)).join("\n"),
    responseKind,
  };
}
