import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import { buildCopilotPrompt } from "@/lib/ai/copilot-prompt";
import { getPromptOverrideConfig } from "@/lib/admin/prompt-overrides";
import { validateCopilotRequest } from "@/lib/ai/validate-copilot-request";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { recordAiUsage } from "@/lib/ai/usage-tracking";
import { checkAiQuota } from "@/lib/billing/quotas";
import { getUserLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { Brand } from "@/types/brand";
import type { SocialAccount } from "@/types/dashboard";
import type { Theme } from "@/types/theme";
import type { Idea } from "@/types/idea";
import type { Publication } from "@/types/publication";
import type { ContentFormat } from "@/types/editorial-calendar";

const MAX_TOKENS = 1400;

interface CopilotApiSuccess {
  status: "ok";
  text: string;
}

interface CopilotApiError {
  status: "error";
  code: string;
  message: string;
}

function errorResponse(code: string, message: string, status: number) {
  const body: CopilotApiError = { status: "error", code, message };
  return NextResponse.json(body, { status });
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return date;
  }
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
  const validation = validateCopilotRequest(rawBody);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

  const { brandId, message, history } = validation.value;

  const { data: brandRow, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (brandError || !brandRow) return errorResponse("unauthorized", "Marque introuvable ou inaccessible.", 404);
  const brand = mapRowToRecord(brandRow) as unknown as Brand;
  const workspaceId = (brandRow as { workspace_id: string }).workspace_id;

  const quota = await checkAiQuota(workspaceId);
  if (!quota.allowed) {
    return errorResponse("quota_exceeded", "Quota mensuel de génération IA atteint pour ce workspace.", 402);
  }

  const { data: accountRows } = await supabase.from("accounts").select("*").eq("brand_id", brandId);
  const connectedAccounts = Array.isArray(accountRows)
    ? (accountRows as Record<string, unknown>[])
        .map((row) => mapRowToRecord(row) as unknown as SocialAccount)
        .filter((account) => account.status === "connected")
    : [];

  const { data: themeRows } = await supabase.from("themes").select("*").eq("brandId", brandId).order("order", { ascending: true });
  const themes = Array.isArray(themeRows)
    ? (themeRows as Record<string, unknown>[]).map((row) => mapRowToRecord(row) as unknown as Theme)
    : [];

  const { data: ideaRows } = await supabase.from("ideas").select("*").eq("brandId", brandId).order("updatedAt", { ascending: false }).limit(12);
  const ideas = Array.isArray(ideaRows)
    ? (ideaRows as Record<string, unknown>[])
        .map((row) => mapRowToRecord(row) as unknown as Idea)
        .slice(0, 12)
    : [];

  // Filtré par workspace_id ET brand (nom) — un utilisateur membre de plusieurs workspaces ne doit
  // jamais voir les publications d'un autre workspace dont la marque porterait le même nom
  // (`brand` est un texte libre, pas une clé étrangère ; workspace_id est la véritable frontière
  // d'isolation ici, appliquée en plus de la RLS par appartenance).
  const { data: publicationRows, error: publicationError } = await supabase
    .from("publications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("brand", brand.name)
    .order("scheduledFor", { ascending: true })
    .limit(12);

  if (publicationError) {
    console.warn("[ia/copilot] impossible de lire les publications du workspace", publicationError.message);
  }

  const publications = Array.isArray(publicationRows)
    ? (publicationRows as Record<string, unknown>[]).map((row) => mapRowToRecord(row) as unknown as Publication)
    : [];

  const promptOverride = await getPromptOverrideConfig("copilot");
  const language = await getUserLocale(supabase, user.id);

  const prompt = buildCopilotPrompt({
    brand,
    language,
    connectedAccounts,
    themes: themes.filter((theme) => theme.active),
    ideas: ideas.map((idea) => ({
      title: idea.title,
      status: idea.status,
      platform: idea.platform ?? undefined,
      format: idea.format as ContentFormat | undefined,
    })),
    publications: publications.map((publication) => ({
      theme: publication.theme,
      scheduledFor: formatDate(publication.scheduledFor),
      platform: publication.platform,
      status: publication.status,
    })),
    message,
    history,
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
      return errorResponse("invalid_response", "Claude a refusé de répondre.", 502);
    }

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    if (!textBlock) return errorResponse("invalid_response", "Réponse Claude sans contenu texte.", 502);

    await recordAiUsage(supabase, {
      workspaceId,
      userId: user.id,
      featureKey: "copilot",
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({ status: "ok", text: textBlock.text } as CopilotApiSuccess);
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/copilot] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
