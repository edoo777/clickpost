import { NextResponse } from "next/server";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildGenerateurPrompt, type GenerateurPromptTheme } from "@/lib/ai/generateur-prompt";
import { parseTopicsResponse } from "@/lib/ai/parse-topics-response";
import { getPromptOverrideConfig } from "@/lib/admin/prompt-overrides";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { recordAiUsage } from "@/lib/ai/usage-tracking";
import { checkAiQuota } from "@/lib/billing/quotas";
import { getUserLocale } from "@/lib/i18n/server-locale";
import { validateTopicsRequest } from "@/lib/ai/validate-topics-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";

/** Génération de sujets du Générateur d'idées, un lot à la fois (voir generateTopicsLot dans
 * topic-generator.ts côté client — la fiabilité des grosses demandes repose sur plusieurs appels
 * successifs à cette route, jamais sur un unique appel géant). Jamais appelée automatiquement :
 * uniquement au clic explicite sur « Générer les idées » ou « Reprendre ce lot ». Route distincte
 * de /api/ia/atelier/generation-complete, qui n'est ni modifiée ni réutilisée directement — seuls
 * le client Anthropic, le rate-limit et l'authentification le sont. */

const TOKENS_PER_IDEA = 150;
const BASE_TOKENS = 500;
const MAX_TOKENS_CEILING = 8000;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const rate = checkRateLimit(user.id);
  if (!rate.allowed) {
    return errorResponse("rate_limited", "Trop de demandes de génération — réessayez dans un instant.", 429);
  }

  const rawBody = await request.json().catch(() => null);
  const validation = validateTopicsRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const { brandId, standalone, niche, themes, formats, platforms, objective, targetAudience, tone, instructions } = validation.value;

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  // Génération ponctuelle (sans marque) : aucune ligne brands/themes en base, la niche saisie
  // manuellement par l'utilisateur fait foi telle quelle — jamais de marque devinée ou inventée.
  let promptNiche = niche ?? "";
  let brandName = "Non précisée (génération ponctuelle)";
  let brandValueProposition: string | undefined;
  let brandAudiencePainPoints: string[] | undefined;
  let brandPreferredContentTypes: string[] | undefined;
  let brandPositioning: string | undefined;
  let brandDescription: string | undefined;
  let existingTitles: string[] | undefined;
  // Absent en mode ponctuel (standalone) — aucune marque/workspace associé, donc aucun quota IA
  // ni journal d'usage à imputer (voir ValidatedTopicsRequest.brandId : volontairement absent).
  let workspaceId: string | undefined;
  if (!standalone) {
    const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single();
    if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
    const brand = mapRowToRecord(brandRow) as unknown as {
      name: string;
      industry: string;
      valueProposition?: string;
      audiencePainPoints?: string[];
      preferredContentTypes?: string[];
      positioning?: string;
      description?: string;
    };
    workspaceId = (brandRow as { workspace_id: string }).workspace_id;

    const quota = await checkAiQuota(workspaceId);
    if (!quota.allowed) {
      return errorResponse("quota_exceeded", "Quota mensuel de génération IA atteint pour ce workspace.", 402);
    }

    promptNiche = brand.industry;
    brandName = brand.name;
    brandValueProposition = brand.valueProposition;
    brandAudiencePainPoints = brand.audiencePainPoints;
    brandPreferredContentTypes = brand.preferredContentTypes;
    brandPositioning = brand.positioning;
    brandDescription = brand.description;

    // Contenu déjà présent pour cette marque — jamais recopié à Claude, seulement pour lui
    // permettre d'éviter un doublon ou une simple paraphrase d'un sujet déjà traité.
    const { data: existingIdeaRows } = await supabase
      .from("ideas")
      .select("title")
      .eq("brand_id", brandId)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (Array.isArray(existingIdeaRows) && existingIdeaRows.length > 0) {
      existingTitles = existingIdeaRows
        .map((row) => (row as { title?: unknown }).title)
        .filter((title): title is string => typeof title === "string" && title.trim().length > 0);
    }
  }

  // Les thématiques ponctuelles (isAdhoc) ne sont jamais enregistrées dans la table themes tant
  // que l'utilisateur n'a pas confirmé leur ajout aux paramètres de la marque (voir addTheme côté
  // client) — seules les thématiques réelles sont vérifiées ici, jamais devinées ni inventées.
  const realThemeIds = themes.filter((theme) => !theme.isAdhoc).map((theme) => theme.themeId);
  let themeById = new Map<string, { id: string; label: string }>();
  if (realThemeIds.length > 0) {
    const { data: themeRows, error: themeError } = await supabase.from("themes").select("*").in("id", realThemeIds).eq("brand_id", brandId);
    if (themeError || !themeRows || themeRows.length !== realThemeIds.length) {
      return errorResponse("unauthorized", "Une ou plusieurs thématiques sont introuvables ou inaccessibles.", 404);
    }
    themeById = new Map(themeRows.map((row) => [row.id as string, mapRowToRecord(row) as unknown as { id: string; label: string }]));
  }

  const promptThemes: GenerateurPromptTheme[] = themes.map((theme) => ({
    themeId: theme.themeId,
    label: theme.isAdhoc ? (theme.themeLabel as string) : (themeById.get(theme.themeId)?.label ?? theme.themeId),
    requestedCount: theme.requestedCount,
    distribution: theme.distribution,
  }));

  const promptOverride = await getPromptOverrideConfig("generateur");
  const language = await getUserLocale(supabase, user.id);

  const prompt = buildGenerateurPrompt({
    niche: promptNiche,
    brandName,
    themes: promptThemes,
    formats,
    platforms,
    objective,
    targetAudience,
    tone,
    instructions,
    valueProposition: brandValueProposition,
    audiencePainPoints: brandAudiencePainPoints,
    preferredContentTypes: brandPreferredContentTypes,
    positioning: brandPositioning,
    description: brandDescription,
    existingTitles,
    language,
    systemPromptOverride: promptOverride.systemPromptOverride,
    extraInstructions: promptOverride.extraInstructions,
  });

  const totalRequested = themes.reduce((sum, theme) => sum + theme.requestedCount, 0);
  const maxTokens = Math.min(MAX_TOKENS_CEILING, BASE_TOKENS + totalRequested * TOKENS_PER_IDEA);

  try {
    const client = getAnthropicClient();
    const model = getAnthropicModel();

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    if (response.stop_reason === "refusal") {
      return errorResponse("invalid_response", "Claude a refusé de générer ce contenu.", 502);
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return errorResponse("invalid_response", "Réponse Claude sans contenu texte.", 502);

    const groups = parseTopicsResponse(textBlock.text, themes.map((theme) => theme.themeId));
    if (!groups || groups.length === 0) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    const totalRejected = groups.reduce((sum, group) => sum + group.rejectedCount, 0);
    if (totalRejected > 0) {
      // Journalisation sans contenu généré (titres/descriptions), uniquement les identifiants
      // et compteurs — jamais de contenu potentiellement sensible dans les journaux serveur.
      console.warn("[ia/generateur/topics] idées rejetées (règle thématique/type de contenu)", {
        userId: user.id,
        brandId,
        totalRejected,
        perTheme: groups.map((group) => ({ themeId: group.themeId, rejectedCount: group.rejectedCount })),
      });
    }

    console.info("[ia/generateur/topics] génération réussie", {
      userId: user.id,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalRequested,
      totalRejected,
    });

    if (workspaceId) {
      await recordAiUsage(supabase, {
        workspaceId,
        userId: user.id,
        featureKey: "generateur.topics",
        model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });
    }

    return NextResponse.json({
      status: "ok",
      groups: groups.map((group) => ({
        themeId: group.themeId,
        ideas: group.ideas.map((idea) => ({
          title: idea.title,
          angle: idea.angle,
          description: idea.description,
          niche: idea.niche,
          theme: idea.theme,
          contentType: idea.contentType,
          format: idea.format,
          objective: idea.objective,
          platform: idea.platform,
        })),
        rejectedCount: group.rejectedCount,
      })),
      model,
      usage: { inputTokens: response.usage.input_tokens ?? 0, outputTokens: response.usage.output_tokens },
    });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/generateur/topics] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
