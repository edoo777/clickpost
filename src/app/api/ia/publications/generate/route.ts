import { NextResponse } from "next/server";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildPublicationGenerationPrompt } from "@/lib/ai/publication-generation-prompt";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { validatePublicationGenerationRequest } from "@/lib/ai/validate-publication-generation-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { Brand } from "@/types/brand";
import type { SocialAccount } from "@/types/dashboard";
import type { Theme } from "@/types/theme";

/**
 * Génération complète du contenu d'une publication (mode Claude de « Nouvelle publication ») —
 * même architecture que /api/ia/atelier/generation-complete : auth, rate-limit, client Anthropic
 * serveur partagé, contexte de marque/thématique revérifié depuis Supabase (jamais celui fourni
 * tel quel par le client). Jamais appelée automatiquement : uniquement sur clic explicite
 * « Générer »/« Régénérer ». Ne crée, ne modifie ni ne sauvegarde aucune donnée : renvoie une
 * proposition que le client applique (ou non) lui-même, champ par champ.
 */

const MAX_TOKENS = 1400;

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
    return errorResponse("rate_limited", "Trop de demandes de génération — réessayez dans un instant.", 429);
  }

  const rawBody = await request.json().catch(() => null);
  const validation = validatePublicationGenerationRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const input = validation.value;

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  // Contexte revérifié côté serveur — jamais le profil de marque fourni tel quel par le client.
  let brand: Brand | undefined;
  let connectedAccountHandles: string[] = [];
  if (input.brandId) {
    const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", input.brandId).single();
    if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
    brand = mapRowToRecord(brandRow) as unknown as Brand;

    const { data: accountRows } = await supabase.from("accounts").select("*").eq("brand_id", input.brandId);
    if (accountRows) {
      connectedAccountHandles = (accountRows as Record<string, unknown>[])
        .map((row) => mapRowToRecord(row) as unknown as SocialAccount)
        .filter((account) => account.status === "connected")
        .map((account) => account.handle)
        .filter((handle): handle is string => Boolean(handle));
    }
  }

  let theme: Theme | undefined;
  if (input.themeId) {
    const { data: themeRow, error: themeError } = await supabase.from("themes").select("*").eq("id", input.themeId).single();
    if (themeError || !themeRow) return errorResponse("unauthorized", "Thématique introuvable ou inaccessible.", 404);
    theme = mapRowToRecord(themeRow) as unknown as Theme;
  }

  const prompt = buildPublicationGenerationPrompt({
    brandName: brand?.name,
    niche: brand?.industry ?? input.standaloneNiche,
    positioning: brand?.positioning,
    valueProposition: brand?.valueProposition,
    brandTone: brand?.toneOfVoice,
    brandAudience: brand?.targetAudience,
    audiencePainPoints: brand?.audiencePainPoints,
    priorityTopics: brand?.priorityTopics,
    preferredCtas: brand?.preferredCtas,
    forbiddenWords: brand?.forbiddenWords,
    connectedAccountHandles,
    themeLabel: theme?.label ?? input.adhocTheme,
    themeObjective: theme?.objective,
    platform: input.platform,
    contentType: input.contentType,
    format: input.format,
    objective: input.objective,
    audience: input.audience,
    tone: input.tone,
    language: input.language,
    length: input.length,
    instructions: input.instructions,
    existingTitle: input.existingTitle,
    existingText: input.existingText,
    existingCta: input.existingCta,
    existingHashtags: input.existingHashtags,
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
      typeof record.theme !== "string" ||
      typeof record.objective !== "string" ||
      !isStringArray(record.titles) ||
      typeof record.text !== "string" ||
      typeof record.cta !== "string" ||
      !isStringArray(record.hashtags) ||
      typeof record.formatSuggestion !== "string" ||
      typeof record.mediaSuggestion !== "string"
    ) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    console.info("[ia/publications/generate] génération réussie", {
      userId: user.id,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({
      status: "ok",
      proposal: {
        theme: record.theme,
        objective: record.objective,
        titles: record.titles,
        text: record.text,
        cta: record.cta,
        hashtags: record.hashtags,
        formatSuggestion: record.formatSuggestion,
        mediaSuggestion: record.mediaSuggestion,
      },
    });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/publications/generate] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
