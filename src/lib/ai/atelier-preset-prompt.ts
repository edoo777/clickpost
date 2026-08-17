import type { PromptPreset } from "@/lib/prompt-presets";
import type { AIGenerationContext } from "@/lib/assisted-generation";
import type { ContentFormat } from "@/types/editorial-calendar";
import { buildBrandContextLines, buildIdeaContextLines } from "@/lib/ai/prompt-context";

export interface AtelierPresetPrompt {
  system: string;
  user: string;
  responseKind: "version" | "text_list" | "report";
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
  /** Compléments configurables depuis l'espace Admin (voir src/lib/admin/prompt-overrides.ts) —
   * systemPromptOverride est prépendu, extraInstructions est ajouté avant la règle de format JSON
   * strict : jamais un remplacement des règles existantes. */
  systemPromptOverride?: string;
  extraInstructions?: string;
}): AtelierPresetPrompt {
  const { preset, context, currentText, currentFormat, systemPromptOverride, extraInstructions } = params;
  const responseKind: AtelierPresetPrompt["responseKind"] =
    preset.action === "hooks" || preset.action === "angles"
      ? "text_list"
      : preset.action === "consistency_check"
      ? "report"
      : "version";

  const systemLines: Array<string | null> = [
    systemPromptOverride ? `Note de l'administrateur ClickPost : ${systemPromptOverride}` : null,
    "Tu es un rédacteur publicitaire francophone spécialisé dans les publications pour les réseaux sociaux.",
    "Tu dois exécuter une seule action sur cette idée, en respectant le contexte de marque et les consignes.",
    ...buildBrandContextLines(context.brand),
    "Respecte le ton demandé et ne propose pas de contenu qui viole les interdits de la marque.",
    `Action à exécuter : ${preset.instruction}`,
    extraInstructions ? `Instructions complémentaires (configurées par l'administrateur ClickPost) : ${extraInstructions}` : null,
    responseSchema(preset),
  ];

  const userLines: Array<string | null> = [
    ...buildIdeaContextLines(context.idea, context.theme),
    currentFormat ? `Format actuel : ${currentFormat}` : null,
    currentText ? `Contenu actuel : ${currentText}` : context.idea.body ? `Contenu existant : ${context.idea.body}` : null,
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
