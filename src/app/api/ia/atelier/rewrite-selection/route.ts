import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildRewriteSelectionPrompt } from "@/lib/ai/rewrite-selection-prompt";
import { validateRewriteSelectionRequest } from "@/lib/ai/validate-rewrite-selection-request";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { recordAiUsage } from "@/lib/ai/usage-tracking";
import { checkAiQuota } from "@/lib/billing/quotas";
import { getUserLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { Brand } from "@/types/brand";
import type { Idea } from "@/types/idea";
import type { Theme } from "@/types/theme";

/** Réécriture d'un passage sélectionné dans l'éditeur de l'Atelier (barre contextuelle de
 * sélection) — même fournisseur Claude centralisé que les préréglages de l'Atelier, pour ne
 * jamais donner deux résultats incohérents pour la même famille d'actions IA. */

const MAX_TOKENS = 500;

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
  const validation = validateRewriteSelectionRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const { ideaId, selectedText, instruction } = validation.value;

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  const { data: ideaRow, error: ideaError } = await supabase.from("ideas").select("*").eq("id", ideaId).single();
  if (ideaError || !ideaRow) return errorResponse("unauthorized", "Idée introuvable ou inaccessible.", 404);
  const idea = mapRowToRecord(ideaRow) as unknown as Idea;

  const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", idea.brandId).single();
  if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
  const brand = mapRowToRecord(brandRow) as unknown as Brand;
  const workspaceId = (brandRow as { workspace_id: string }).workspace_id;

  const quota = await checkAiQuota(workspaceId);
  if (!quota.allowed) {
    return errorResponse("quota_exceeded", "Quota mensuel de génération IA atteint pour ce workspace.", 402);
  }

  let theme: Theme | undefined;
  if (idea.themeId) {
    const { data: themeRow } = await supabase.from("themes").select("*").eq("id", idea.themeId).single();
    if (themeRow) theme = mapRowToRecord(themeRow) as unknown as Theme;
  }

  const language = await getUserLocale(supabase, user.id);
  const prompt = buildRewriteSelectionPrompt({
    context: { idea, brand, theme, tone: idea.tone ?? "professional", length: "medium", instructions: "" },
    selectedText,
    instruction,
    language,
  });

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
      return errorResponse("invalid_response", "Claude a refusé de générer ce contenu.", 502);
    }

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    if (!textBlock) return errorResponse("invalid_response", "Réponse Claude sans contenu texte.", 502);

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    if (typeof parsed !== "object" || parsed === null || typeof (parsed as Record<string, unknown>).text !== "string") {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    await recordAiUsage(supabase, {
      workspaceId,
      userId: user.id,
      featureKey: "atelier.rewrite_selection",
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({ status: "ok", text: (parsed as { text: string }).text });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/atelier/rewrite-selection] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
