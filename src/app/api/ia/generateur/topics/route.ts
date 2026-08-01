import { NextResponse } from "next/server";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildGenerateurPrompt, type GenerateurPromptTheme } from "@/lib/ai/generateur-prompt";
import { parseTopicsResponse } from "@/lib/ai/parse-topics-response";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { validateTopicsRequest } from "@/lib/ai/validate-topics-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";

/** Génération multi-thématiques du Générateur d'idées — un seul appel Claude pour toutes les
 * thématiques d'une même demande (voir topic-generator.ts côté client). Jamais appelée
 * automatiquement : uniquement au clic explicite sur « Générer les idées ». Route distincte de
 * /api/ia/atelier/generation-complete, qui n'est ni modifiée ni réutilisée directement — seuls
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
  const { brandId, themes, formats, platforms, objective, targetAudience, tone, instructions } = validation.value;

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
  const brand = mapRowToRecord(brandRow) as unknown as { name: string; industry: string };

  const themeIds = themes.map((theme) => theme.themeId);
  const { data: themeRows, error: themeError } = await supabase.from("themes").select("*").in("id", themeIds).eq("brand_id", brandId);
  if (themeError || !themeRows || themeRows.length !== themeIds.length) {
    return errorResponse("unauthorized", "Une ou plusieurs thématiques sont introuvables ou inaccessibles.", 404);
  }
  const themeById = new Map(themeRows.map((row) => [row.id as string, mapRowToRecord(row) as unknown as { id: string; label: string }]));

  const promptThemes: GenerateurPromptTheme[] = themes.map((theme) => ({
    themeId: theme.themeId,
    label: themeById.get(theme.themeId)?.label ?? theme.themeId,
    requestedCount: theme.requestedCount,
    distribution: theme.distribution,
  }));

  const prompt = buildGenerateurPrompt({
    niche: brand.industry,
    brandName: brand.name,
    themes: promptThemes,
    formats,
    platforms,
    objective,
    targetAudience,
    tone,
    instructions,
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

    const groups = parseTopicsResponse(textBlock.text, themeIds);
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

    return NextResponse.json({
      status: "ok",
      groups: groups.map((group) => ({
        themeId: group.themeId,
        ideas: group.ideas.map((idea) => ({
          title: idea.title,
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
