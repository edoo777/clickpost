import { NextResponse } from "next/server";
import Anthropic, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { buildAtelierGenerationPrompt } from "@/lib/ai/atelier-prompts";
import { parseAtelierResponse } from "@/lib/ai/parse-atelier-response";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { recordAiUsage } from "@/lib/ai/usage-tracking";
import { validateGenerationRequest } from "@/lib/ai/validate-generation-request";
import type { AIGenerationContext } from "@/lib/assisted-generation";
import { checkAiQuota } from "@/lib/billing/quotas";
import { getUserLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { Brand } from "@/types/brand";
import type { Idea } from "@/types/idea";
import type { Theme } from "@/types/theme";

/** Génération complète d'une publication texte dans l'Atelier — seule action réellement
 * branchée à Claude en F2.1 (voir content-generation-provider.ts). Jamais appelée
 * automatiquement : uniquement sur clic explicite dans l'Atelier. */

const MAX_TOKENS = 1024;

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
  const validation = validateGenerationRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const { ideaId, tone, length, instructions } = validation.value;

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  // Contexte revérifié côté serveur depuis Supabase (RLS) — jamais le contexte fourni tel quel
  // par le client, pour ne jamais envoyer à Claude une voix de marque falsifiée ou une idée hors
  // du workspace de l'utilisateur authentifié.
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
  const context: AIGenerationContext = { idea, brand, theme, tone, length, instructions };
  const prompt = buildAtelierGenerationPrompt(context, language);

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

    const parsed = parseAtelierResponse(textBlock.text);
    if (!parsed) return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);

    const truncated = response.stop_reason === "max_tokens";

    // Suivi de consommation minimal (F2.1) — journalisation uniquement, aucune persistance en
    // base (proposée séparément, avec migration et dry-run, si le besoin se confirme en F2.5).
    console.info("[ia/atelier/generation-complete] génération réussie", {
      userId: user.id,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      truncated,
    });

    await recordAiUsage(supabase, {
      workspaceId,
      userId: user.id,
      featureKey: "atelier.generation_complete",
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({
      status: "ok",
      content: parsed,
      usage: { inputTokens: response.usage.input_tokens ?? 0, outputTokens: response.usage.output_tokens },
      model,
      truncated,
    });
  } catch (error) {
    if (error instanceof RateLimitError) return errorResponse("quota_exceeded", "Quota Claude dépassé.", 429);
    if (error instanceof AuthenticationError) return errorResponse("not_configured", "Clé Claude invalide.", 503);
    if (error instanceof APIConnectionTimeoutError) return errorResponse("timeout", "Délai d'attente Claude dépassé.", 504);
    if (error instanceof APIConnectionError) return errorResponse("provider_unavailable", "Service Claude injoignable.", 503);
    if (error instanceof APIError) return errorResponse("provider_unavailable", "Erreur du fournisseur IA.", 502);
    console.error("[ia/atelier/generation-complete] erreur inattendue", error);
    return errorResponse("unknown_error", "Erreur inattendue.", 500);
  }
}
