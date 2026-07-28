import {
  addCtaText,
  addExamplesText,
  addStorytellingText,
  adaptForPlatform,
  buildAIVersion,
  buildAngles,
  buildConclusionText,
  buildEmailBody,
  buildHooks,
  buildPlanSections,
  changeTone,
  checkConsistency,
  clarifyText,
  correctFrenchText,
  expandText,
  generateContentBody,
  makePersuasiveText,
  regenerateTextSection,
  rewriteSelectionText,
  shortenText,
  simplifyText,
  suggestCta,
  type AIGenerationContext,
} from "@/lib/assisted-generation";
import { buildTransformedVersion, nextVersionNumber } from "@/lib/content-versions";
import type { PromptPreset } from "@/lib/prompt-presets";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { ContentVersion, TextBody } from "@/types/content-version";

export type PresetResult =
  | { kind: "version"; version: ContentVersion }
  | { kind: "text_list"; label: string; items: string[] }
  | { kind: "report"; label: string; items: string[] };

/**
 * Abstraction de génération de contenu — préparée pour être remplacée demain par un fournisseur
 * IA distant (OpenAI, Anthropic, ou autre) sans changer l'UI qui l'appelle. Aujourd'hui, seule
 * l'implémentation simulée existe : aucune clé, aucun appel réseau, résultats déterministes.
 */
export interface ContentGenerationProvider {
  readonly isSimulated: boolean;
  generateFromPreset(
    preset: PromptPreset,
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[]
  ): PresetResult | null;
  rewriteSelection(selectedText: string, instruction: string, context: AIGenerationContext): string;
  generateFullContent(context: AIGenerationContext, format: ContentFormat, versions: ContentVersion[]): ContentVersion;
  generateHooks(context: AIGenerationContext, count?: number): string[];
  generateCTA(context: AIGenerationContext): string;
  adaptToPlatform(
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    platform: SocialPlatform,
    versions: ContentVersion[]
  ): ContentVersion | null;
}

function resolveTextBody(currentVersion: ContentVersion | undefined, context: AIGenerationContext): TextBody {
  if (currentVersion?.format === "text") return currentVersion.body;
  const generated = generateContentBody("text", context);
  return generated.body as TextBody;
}

function textResultVersion(
  source: ContentVersion | undefined,
  transformedBody: TextBody,
  versions: ContentVersion[],
  name: string,
  ideaId: string
): ContentVersion {
  if (source && source.format === "text") {
    return buildTransformedVersion(source, transformedBody, versions, name);
  }
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ideaId,
    versionNumber: nextVersionNumber(versions),
    name,
    source: "ai",
    format: "text",
    body: transformedBody,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
  };
}

class SimulatedContentGenerationProvider implements ContentGenerationProvider {
  readonly isSimulated = true;

  generateFromPreset(
    preset: PromptPreset,
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[]
  ): PresetResult | null {
    const ideaId = context.idea.id;
    const body = () => resolveTextBody(currentVersion, context);
    const asVersion = (transformed: TextBody) => textResultVersion(currentVersion, transformed, versions, preset.name, ideaId);

    switch (preset.action) {
      case "full_generation":
        return { kind: "version", version: buildAIVersion(context, context.idea.format ?? "text", versions, preset.name) };
      case "hooks":
        return { kind: "text_list", label: "Choisissez un hook à insérer", items: buildHooks(context, 5) };
      case "angles":
        return { kind: "text_list", label: "Choisissez un angle à développer", items: buildAngles(context, 3) };
      case "plan": {
        const sections = buildPlanSections(context, 3);
        return { kind: "version", version: asVersion({ ...body(), intro: sections.join("\n") }) };
      }
      case "clarify":
        return { kind: "version", version: asVersion(clarifyText(body())) };
      case "shorten":
        return { kind: "version", version: asVersion(shortenText(body())) };
      case "expand":
        return { kind: "version", version: asVersion(expandText(body(), context)) };
      case "correct_french":
        return { kind: "version", version: asVersion(correctFrenchText(body())) };
      case "simplify":
        return { kind: "version", version: asVersion(simplifyText(body())) };
      case "persuasive":
        return { kind: "version", version: asVersion(makePersuasiveText(body())) };
      case "storytelling":
        return { kind: "version", version: asVersion(addStorytellingText(body(), context)) };
      case "add_examples":
        return { kind: "version", version: asVersion(addExamplesText(body(), context)) };
      case "add_cta":
        return { kind: "version", version: asVersion(addCtaText(body(), context)) };
      case "conclusion":
        return { kind: "version", version: asVersion(buildConclusionText(body(), context)) };
      case "add_hashtags":
        return { kind: "version", version: asVersion(regenerateTextSection(body(), "hashtags", context)) };
      case "first_comment":
        return { kind: "version", version: asVersion(regenerateTextSection(body(), "firstComment", context)) };
      case "consistency_check":
        return { kind: "report", label: "Résultat de la vérification", items: checkConsistency(body()) };
      case "adapt_platform":
        if (!preset.targetPlatform) return null;
        return { kind: "version", version: asVersion(adaptForPlatform(body(), preset.targetPlatform)) };
      case "transform_format":
        if (!preset.targetFormat) return null;
        return { kind: "version", version: buildAIVersion(context, preset.targetFormat, versions, preset.name) };
      case "transform_email":
        return { kind: "version", version: asVersion(buildEmailBody(context)) };
      case "apply_tone": {
        if (!preset.tone) return null;
        const toneContext: AIGenerationContext = { ...context, tone: preset.tone };
        return { kind: "version", version: asVersion(changeTone(body(), preset.tone, toneContext)) };
      }
      default:
        return null;
    }
  }

  rewriteSelection(selectedText: string, instruction: string, context: AIGenerationContext): string {
    return rewriteSelectionText(selectedText, instruction, context);
  }

  generateFullContent(context: AIGenerationContext, format: ContentFormat, versions: ContentVersion[]): ContentVersion {
    return buildAIVersion(context, format, versions);
  }

  generateHooks(context: AIGenerationContext, count = 5): string[] {
    return buildHooks(context, count);
  }

  generateCTA(context: AIGenerationContext): string {
    return suggestCta(context);
  }

  adaptToPlatform(
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    platform: SocialPlatform,
    versions: ContentVersion[]
  ): ContentVersion | null {
    if (!currentVersion || currentVersion.format !== "text") return null;
    return buildTransformedVersion(currentVersion, adaptForPlatform(currentVersion.body, platform), versions, `Adaptée pour ${platform}`);
  }
}

/**
 * Implémentation active aujourd'hui. Une future `RemoteAIContentGenerationProvider` (OpenAI,
 * Anthropic…) implémentera la même interface `ContentGenerationProvider` et pourra remplacer
 * cet export sans changer l'UI qui la consomme.
 */
export const contentGenerationProvider: ContentGenerationProvider = new SimulatedContentGenerationProvider();
