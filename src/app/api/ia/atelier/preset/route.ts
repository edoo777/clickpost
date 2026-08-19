import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildAtelierPresetPrompt } from "@/lib/ai/atelier-preset-prompt";
import { validateAtelierPresetRequest } from "@/lib/ai/validate-atelier-preset-request";
import { getPromptOverrideConfig } from "@/lib/admin/prompt-overrides";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { recordAiUsage } from "@/lib/ai/usage-tracking";
import { checkAiQuota } from "@/lib/billing/quotas";
import { getUserLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { PROMPT_PRESETS } from "@/lib/prompt-presets";
import type { Brand } from "@/types/brand";
import type { Idea } from "@/types/idea";
import type { Theme } from "@/types/theme";
import type { TextBody } from "@/types/content-version";

interface AtelierPresetApiSuccessVersion {
  status: "ok";
  resultKind: "version";
  content: TextBody;
}
interface AtelierPresetApiSuccessTextList {
  status: "ok";
  resultKind: "text_list";
  items: string[];
}
interface AtelierPresetApiSuccessReport {
  status: "ok";
  resultKind: "report";
  items: string[];
}
interface AtelierPresetApiError {
  status: "error";
  code: string;
  message: string;
}

const MAX_TOKENS = 1200;

function errorResponse(code: string, message: string, status: number) {
  const body: AtelierPresetApiError = { status: "error", code, message };
  return NextResponse.json(body, { status });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateTextBody(value: unknown): value is TextBody {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.hook === "string" &&
    typeof record.intro === "string" &&
    typeof record.body === "string" &&
    typeof record.conclusion === "string" &&
    typeof record.cta === "string" &&
    Array.isArray(record.hashtags) &&
    record.hashtags.every((item) => typeof item === "string")
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
  const validation = validateAtelierPresetRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const { ideaId, presetId, tone, length, instructions, currentText, currentFormat } = validation.value;

  const preset = PROMPT_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) return errorResponse("invalid_request", "Préréglage IA introuvable.", 400);

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

  const promptOverride = await getPromptOverrideConfig("atelier");
  const language = await getUserLocale(supabase, user.id);

  const prompt = buildAtelierPresetPrompt({
    preset,
    context: { idea, brand, theme, tone, length, instructions },
    currentText,
    currentFormat,
    language,
    systemPromptOverride: promptOverride.systemPromptOverride,
    extraInstructions: promptOverride.extraInstructions,
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

    await recordAiUsage(supabase, {
      workspaceId,
      userId: user.id,
      featureKey: "atelier.preset",
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    if (prompt.responseKind === "version") {
      if (!validateTextBody(parsed)) {
        return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
      }
      const body: AtelierPresetApiSuccessVersion = { status: "ok", resultKind: "version", content: parsed };
      return NextResponse.json(body);
    }

    if (prompt.responseKind === "text_list") {
      if (!Array.isArray(parsed) && typeof parsed === "object" && parsed !== null) {
        parsed = (parsed as Record<string, unknown>).items;
      }
      if (!isStringArray(parsed) || parsed.length === 0) {
        return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
      }
      const body: AtelierPresetApiSuccessTextList = { status: "ok", resultKind: "text_list", items: parsed };
      return NextResponse.json(body);
    }

    if (prompt.responseKind === "report") {
      if (!Array.isArray(parsed) && typeof parsed === "object" && parsed !== null) {
        parsed = (parsed as Record<string, unknown>).items;
      }
      if (!isStringArray(parsed) || parsed.length === 0) {
        return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
      }
      const body: AtelierPresetApiSuccessReport = { status: "ok", resultKind: "report", items: parsed };
      return NextResponse.json(body);
    }

    return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/atelier/preset] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
