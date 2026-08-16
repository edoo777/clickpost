import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildRapportsGeneratePrompt } from "@/lib/ai/rapports-prompt";
import { validateRapportsGenerateRequest } from "@/lib/ai/validate-rapports-generate-request";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { Brand } from "@/types/brand";
import type { RecommendationCategory, ReportActionPlanItem, ReportNarrativeContent, ReportRecommendation } from "@/types/report";

/** Génération du rapport narratif complet du module Rapports — remplace l'ancienne action isolée
 * "Analyser avec Claude" (/api/ia/rapports/analyze, supprimée) : c'est désormais l'appel IA
 * principal du parcours "Générer le rapport". Reçoit le payload déjà calculé côté client (voir
 * build-report-data.ts) et ne fait que l'interpréter, jamais inventer de métrique absente. */

const MAX_TOKENS = 2400;
const CATEGORIES: RecommendationCategory[] = ["continue", "improve", "stop", "test"];

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidRecommendations(value: unknown): value is ReportRecommendation[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const record = item as Record<string, unknown>;
      return typeof record.text === "string" && CATEGORIES.includes(record.category as RecommendationCategory);
    })
  );
}

function isValidActionPlan(value: unknown): value is ReportActionPlanItem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const record = item as Record<string, unknown>;
      if (typeof record.text !== "string") return false;
      return record.suggestedTopicTitle === undefined || typeof record.suggestedTopicTitle === "string";
    })
  );
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
  const validation = validateRapportsGenerateRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const { brandId, snapshot } = validation.value;

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
  const brand = mapRowToRecord(brandRow) as unknown as Brand;

  const prompt = buildRapportsGeneratePrompt({ snapshot, brand, reportType: snapshot.reportType });

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
      return errorResponse("invalid_response", "Claude a refusé de générer ce rapport.", 502);
    }

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    if (!textBlock) return errorResponse("invalid_response", "Réponse Claude sans contenu texte.", 502);

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    if (typeof parsed !== "object" || parsed === null) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }
    const record = parsed as Record<string, unknown>;
    const executiveSummary = record.executiveSummary as Record<string, unknown> | undefined;
    const aiAnalysis = record.aiAnalysis as Record<string, unknown> | undefined;

    if (
      typeof executiveSummary?.narrative !== "string" ||
      !isStringArray(executiveSummary.highlights) ||
      typeof record.workDoneNarrative !== "string" ||
      typeof record.performanceOverviewNarrative !== "string" ||
      typeof record.performanceByPlatformNarrative !== "string" ||
      typeof record.contentPerformanceNarrative !== "string" ||
      typeof aiAnalysis?.narrative !== "string" ||
      !isStringArray(aiAnalysis.insights) ||
      !isStringArray(aiAnalysis.anomalies) ||
      !isValidRecommendations(record.recommendations) ||
      !isValidActionPlan(record.actionPlan)
    ) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    const narrative: ReportNarrativeContent = {
      executiveSummary: { narrative: executiveSummary.narrative, highlights: executiveSummary.highlights },
      workDoneNarrative: record.workDoneNarrative,
      performanceOverviewNarrative: record.performanceOverviewNarrative,
      performanceByPlatformNarrative: record.performanceByPlatformNarrative,
      contentPerformanceNarrative: record.contentPerformanceNarrative,
      aiAnalysis: { narrative: aiAnalysis.narrative, insights: aiAnalysis.insights, anomalies: aiAnalysis.anomalies },
      recommendations: record.recommendations,
      actionPlan: record.actionPlan,
    };

    console.info("[ia/rapports/generate] rapport généré", {
      userId: user.id,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({ status: "ok", narrative });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/rapports/generate] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
