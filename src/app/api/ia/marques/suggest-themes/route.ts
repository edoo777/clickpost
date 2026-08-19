import { NextResponse } from "next/server";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { parseThemeSuggestions } from "@/lib/ai/parse-theme-suggestions";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { buildSuggestThemesPrompt } from "@/lib/ai/suggest-themes-prompt";
import { recordAiUsage } from "@/lib/ai/usage-tracking";
import { checkAiQuota } from "@/lib/billing/quotas";
import { getUserLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";

/** Suggestion de thématiques éditoriales à partir de la niche/positionnement d'une marque —
 * jamais enregistrée automatiquement (voir BrandThemesSection.tsx). Route sœur de
 * /api/ia/atelier/generation-complete et /api/ia/generateur/topics : même client Anthropic, même
 * rate-limit, même authentification, jamais dupliqués. Déclenchée uniquement par un clic
 * explicite sur « Suggérer des thématiques avec Claude ». */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const brandId = (rawBody as Record<string, unknown> | null)?.brandId;
  if (typeof brandId !== "string" || !UUID_PATTERN.test(brandId)) {
    return errorResponse("invalid_request", "Identifiant de marque invalide.", 400);
  }

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
  const brand = mapRowToRecord(brandRow) as unknown as {
    name: string;
    industry: string;
    subNiche?: string;
    positioning?: string;
    targetAudience?: string;
  };
  const workspaceId = (brandRow as { workspace_id: string }).workspace_id;

  const quota = await checkAiQuota(workspaceId);
  if (!quota.allowed) {
    return errorResponse("quota_exceeded", "Quota mensuel de génération IA atteint pour ce workspace.", 402);
  }

  const { data: themeRows } = await supabase.from("themes").select("label").eq("brand_id", brandId).is("deleted_at", null);
  const existingThemeLabels = (themeRows ?? []).map((row) => row.label as string).filter(Boolean);

  const language = await getUserLocale(supabase, user.id);
  const prompt = buildSuggestThemesPrompt(
    {
      brandName: brand.name,
      niche: brand.industry,
      subNiche: brand.subNiche,
      positioning: brand.positioning,
      targetAudience: brand.targetAudience,
      existingThemeLabels,
    },
    language
  );

  try {
    const client = getAnthropicClient();
    const model = getAnthropicModel();

    const response = await client.messages.create({
      model,
      max_tokens: 1200,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    if (response.stop_reason === "refusal") {
      return errorResponse("invalid_response", "Claude a refusé de générer ce contenu.", 502);
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return errorResponse("invalid_response", "Réponse Claude sans contenu texte.", 502);

    const suggestions = parseThemeSuggestions(textBlock.text);
    if (!suggestions || suggestions.length === 0) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    console.info("[ia/marques/suggest-themes] génération réussie", {
      userId: user.id,
      brandId,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      suggestionCount: suggestions.length,
    });

    await recordAiUsage(supabase, {
      workspaceId,
      userId: user.id,
      featureKey: "marques.suggest_themes",
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({ status: "ok", suggestions, model });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/marques/suggest-themes] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
