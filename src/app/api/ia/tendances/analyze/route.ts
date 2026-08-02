import { NextResponse } from "next/server";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { buildTrendAnalysisPrompt } from "@/lib/ai/trend-analysis-prompt";
import { validateTrendAnalysisRequest } from "@/lib/ai/validate-trend-analysis-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * « Analyser avec Claude » — jamais déclenchée automatiquement, uniquement au clic explicite sur
 * une tendance ou une actualité déjà affichée. Réutilise le client Anthropic serveur, le
 * rate-limit et l'authentification déjà en place pour les autres routes /api/ia/*. Ne lit ni
 * n'écrit aucune donnée Supabase : seul le texte transmis explicitement par le client est envoyé
 * à Claude.
 */

const MAX_TOKENS = 900;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const rate = checkRateLimit(user.id);
  if (!rate.allowed) {
    return errorResponse("rate_limited", "Trop de demandes — réessayez dans un instant.", 429);
  }

  const rawBody = await request.json().catch(() => null);
  const validation = validateTrendAnalysisRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  const prompt = buildTrendAnalysisPrompt(validation.value);

  try {
    const client = getAnthropicClient();
    const model = getAnthropicModel();

    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    if (response.stop_reason === "refusal") {
      return errorResponse("invalid_response", "Claude a refusé de générer cette analyse.", 502);
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return errorResponse("invalid_response", "Réponse Claude sans contenu texte.", 502);

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    const record = parsed as Record<string, unknown> | null;
    if (
      !record ||
      typeof record.relevance !== "string" ||
      typeof record.targetBrand !== "string" ||
      !isStringArray(record.suggestedContentTypes) ||
      !isStringArray(record.suggestedFormats) ||
      typeof record.suggestedPlatform !== "string" ||
      typeof record.risks !== "string"
    ) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    console.info("[ia/tendances/analyze] analyse exécutée", {
      userId: user.id,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({
      status: "ok",
      analysis: {
        relevance: record.relevance,
        targetBrand: record.targetBrand,
        suggestedContentTypes: record.suggestedContentTypes,
        suggestedFormats: record.suggestedFormats,
        suggestedPlatform: record.suggestedPlatform,
        risks: record.risks,
      },
    });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/tendances/analyze] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
