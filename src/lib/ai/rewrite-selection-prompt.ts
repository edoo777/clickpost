import type { AIGenerationContext } from "@/lib/assisted-generation";
import { buildBrandContextLines, buildIdeaContextLines, buildLanguageInstruction } from "@/lib/ai/prompt-context";
import type { Locale } from "@/lib/i18n/locale";

export interface RewriteSelectionPrompt {
  system: string;
  user: string;
}

/**
 * Prompt pour la barre contextuelle de sélection de l'Atelier (réécrire/raccourcir/développer/
 * corriger/changer le ton/simplifier un passage sélectionné dans l'éditeur). Réutilise le même
 * contexte de marque et d'idée que les préréglages de l'Atelier, pour ne jamais produire un
 * résultat incohérent avec le reste de l'Atelier.
 */
export function buildRewriteSelectionPrompt(params: {
  context: AIGenerationContext;
  selectedText: string;
  instruction: string;
  language: Locale;
}): RewriteSelectionPrompt {
  const { context, selectedText, instruction, language } = params;

  const systemLines = [
    "Tu es un rédacteur publicitaire spécialisé dans les publications pour les réseaux sociaux.",
    buildLanguageInstruction(language),
    "Tu dois réécrire uniquement le passage sélectionné fourni, selon l'instruction donnée, en respectant le contexte de marque.",
    ...buildBrandContextLines(context.brand),
    "Ne propose pas de contenu qui viole les interdits de la marque.",
    "Ne réponds qu'avec le passage réécrit, sans commentaire ni explication ni guillemets englobants.",
    `Ton demandé : ${context.tone}`,
    'Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après : {"text":"..."}.',
  ];

  const userLines = [
    ...buildIdeaContextLines(context.idea, context.theme),
    `Instruction : ${instruction}`,
    `Passage à réécrire : ${selectedText}`,
  ];

  return {
    system: systemLines.filter((line): line is string => Boolean(line)).join("\n"),
    user: userLines.filter((line): line is string => Boolean(line)).join("\n"),
  };
}
