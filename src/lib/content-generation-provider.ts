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

/** Origine réelle d'un résultat — permet à l'interface d'afficher clairement si une génération
 * vient de Claude (IA réelle) ou du générateur simulé (repli ou action non encore branchée). */
export type GenerationSource = "claude" | "simulated";

export type PresetResult =
  | { kind: "version"; version: ContentVersion; source?: GenerationSource; fallbackReason?: string }
  | { kind: "text_list"; label: string; items: string[] }
  | { kind: "report"; label: string; items: string[] };

/**
 * Abstraction de génération de contenu — implémentée par un générateur simulé (déterministe,
 * aucun appel réseau) et par `RemoteAIContentGenerationProvider` (Claude réel, F2.1). Seules
 * `generateFromPreset` et `generateFullContent` sont asynchrones : ce sont les deux seules
 * méthodes empruntées par l'action « Génération complète » branchée en F2.1. Les autres méthodes
 * restent synchrones pour ne pas élargir inutilement le périmètre de cette sous-phase (elles
 * seront élargies en même temps qu'elles seront réellement branchées à Claude, en F2.2+).
 */
export interface ContentGenerationProvider {
  readonly isSimulated: boolean;
  generateFromPreset(
    preset: PromptPreset,
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[]
  ): Promise<PresetResult | null>;
  rewriteSelection(selectedText: string, instruction: string, context: AIGenerationContext): string;
  generateFullContent(context: AIGenerationContext, format: ContentFormat, versions: ContentVersion[]): Promise<ContentVersion>;
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

function buildCurrentVersionText(currentVersion: ContentVersion | undefined, context: AIGenerationContext): string | undefined {
  if (currentVersion?.format === "text") {
    const { hook, intro, body, conclusion, cta, hashtags, firstComment } = currentVersion.body;
    const segments = [
      hook ? `Accroche : ${hook}` : null,
      intro ? `Introduction : ${intro}` : null,
      body ? `Corps : ${body}` : null,
      conclusion ? `Conclusion : ${conclusion}` : null,
      cta ? `Appel à l'action : ${cta}` : null,
      hashtags?.length ? `Hashtags : ${hashtags.join(" ")}` : null,
      firstComment ? `Premier commentaire : ${firstComment}` : null,
    ].filter((segment): segment is string => Boolean(segment));
    if (segments.length > 0) return segments.join("\n\n");
  }

  const ideaBody = context.idea.body?.trim();
  return ideaBody ? ideaBody : undefined;
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

  private generateFromPresetSync(
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

  async generateFromPreset(
    preset: PromptPreset,
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[]
  ): Promise<PresetResult | null> {
    const result = this.generateFromPresetSync(preset, context, currentVersion, versions);
    if (!result) return null;
    return result.kind === "version" ? { ...result, source: "simulated" } : result;
  }

  rewriteSelection(selectedText: string, instruction: string, context: AIGenerationContext): string {
    return rewriteSelectionText(selectedText, instruction, context);
  }

  async generateFullContent(context: AIGenerationContext, format: ContentFormat, versions: ContentVersion[]): Promise<ContentVersion> {
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

interface AtelierGenerationApiSuccess {
  status: "ok";
  content: { hook: string; intro: string; body: string; conclusion: string; cta: string; hashtags: string[] };
}
interface AtelierGenerationApiError {
  status: "error";
  code: string;
  message: string;
}
type AtelierGenerationApiResponse = AtelierGenerationApiSuccess | AtelierGenerationApiError;

type RemoteOutcome = { result: PresetResult } | { reason: string };

/**
 * Fournisseur actif par défaut. N'appelle jamais Anthropic directement (aucun SDK importé ici,
 * ce module est chargé côté client) — uniquement `fetch` vers nos propres routes serveur qui
 * détiennent la clé et décident si un appel réel a lieu. Toutes les actions de l'Atelier peuvent
 * désormais tenter Claude ; un échec tombe en repli sur le générateur simulé, pour ne jamais bloquer.
 */
class RemoteAIContentGenerationProvider implements ContentGenerationProvider {
  readonly isSimulated = false;
  private readonly fallback = new SimulatedContentGenerationProvider();

  private async tryRemoteFullGeneration(
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[],
    presetName: string
  ): Promise<RemoteOutcome> {
    try {
      const response = await fetch("/api/ia/atelier/generation-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: context.idea.id,
          tone: context.tone,
          length: context.length,
          instructions: context.instructions ?? "",
        }),
      });
      const data = (await response.json().catch(() => null)) as AtelierGenerationApiResponse | null;
      if (!data) return { reason: `http_${response.status}` };
      if (data.status !== "ok") return { reason: data.code };

      const transformedBody: TextBody = {
        hook: data.content.hook,
        intro: data.content.intro,
        body: data.content.body,
        conclusion: data.content.conclusion,
        cta: data.content.cta,
        hashtags: data.content.hashtags,
      };
      const version = textResultVersion(currentVersion, transformedBody, versions, presetName, context.idea.id);
      return { result: { kind: "version", version, source: "claude" } };
    } catch {
      return { reason: "network_error" };
    }
  }

  private async tryRemotePresetGeneration(
    preset: PromptPreset,
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[]
  ): Promise<RemoteOutcome> {
    try {
      const response = await fetch("/api/ia/atelier/preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: context.idea.id,
          presetId: preset.id,
          tone: context.tone,
          length: context.length,
          instructions: context.instructions ?? "",
          currentText: buildCurrentVersionText(currentVersion, context),
          currentFormat: currentVersion?.format,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { status: "ok"; resultKind: "version"; content: TextBody }
        | { status: "ok"; resultKind: "text_list"; items: string[] }
        | { status: "ok"; resultKind: "report"; items: string[] }
        | { status: "error"; code: string; message: string }
        | null;
      if (!data) return { reason: `http_${response.status}` };
      if (data.status !== "ok") return { reason: data.code };

      if (data.resultKind === "version") {
        const version = textResultVersion(currentVersion, data.content, versions, preset.name, context.idea.id);
        return { result: { kind: "version", version, source: "claude" } };
      }

      const label = preset.action === "hooks"
        ? "Choisissez un hook à insérer"
        : preset.action === "angles"
          ? "Choisissez un angle à développer"
          : "Résultat de la génération";

      if (data.resultKind === "text_list") {
        return { result: { kind: "text_list", label, items: data.items } };
      }

      return { result: { kind: "report", label: "Résultat de la vérification", items: data.items } };
    } catch {
      return { reason: "network_error" };
    }
  }

  async generateFromPreset(
    preset: PromptPreset,
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    versions: ContentVersion[]
  ): Promise<PresetResult | null> {
    if (preset.action === "full_generation") {
      const outcome = await this.tryRemoteFullGeneration(context, currentVersion, versions, preset.name);
      if ("result" in outcome) return outcome.result;

      const fallbackResult = await this.fallback.generateFromPreset(preset, context, currentVersion, versions);
      if (fallbackResult?.kind === "version") return { ...fallbackResult, fallbackReason: outcome.reason };
      return fallbackResult;
    }

    const outcome = await this.tryRemotePresetGeneration(preset, context, currentVersion, versions);
    if ("result" in outcome) return outcome.result;

    const fallbackResult = await this.fallback.generateFromPreset(preset, context, currentVersion, versions);
    if (fallbackResult?.kind === "version") return { ...fallbackResult, fallbackReason: outcome.reason };
    return fallbackResult;
  }

  rewriteSelection(selectedText: string, instruction: string, context: AIGenerationContext): string {
    return this.fallback.rewriteSelection(selectedText, instruction, context);
  }

  async generateFullContent(context: AIGenerationContext, format: ContentFormat, versions: ContentVersion[]): Promise<ContentVersion> {
    return this.fallback.generateFullContent(context, format, versions);
  }

  generateHooks(context: AIGenerationContext, count = 5): string[] {
    return this.fallback.generateHooks(context, count);
  }

  generateCTA(context: AIGenerationContext): string {
    return this.fallback.generateCTA(context);
  }

  adaptToPlatform(
    context: AIGenerationContext,
    currentVersion: ContentVersion | undefined,
    platform: SocialPlatform,
    versions: ContentVersion[]
  ): ContentVersion | null {
    return this.fallback.adaptToPlatform(context, currentVersion, platform, versions);
  }
}

/**
 * Implémentation active aujourd'hui. Le générateur simulé reste utilisé en repli automatique
 * tant que l'intégration Anthropic n'est pas configurée côté serveur (F2.1), ou si un appel réel
 * échoue pour quelque raison que ce soit — jamais de blocage de l'interface.
 */
export const contentGenerationProvider: ContentGenerationProvider = new RemoteAIContentGenerationProvider();
