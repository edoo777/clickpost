import { NextResponse } from "next/server";
import { getAnthropicClient, getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/anthropic-client";
import { classifyAnthropicError } from "@/lib/ai/classify-anthropic-error";
import {
  buildNoteQuickActionPrompt,
  buildPublicationQuickActionPrompt,
  buildQuickActionPrompt,
  type QuickActionPrompt,
} from "@/lib/ai/quick-action-prompt";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import {
  isNoteQuickActionKind,
  isPublicationQuickActionKind,
  validateNoteQuickActionRequest,
  validatePublicationQuickActionRequest,
  validateQuickActionRequest,
} from "@/lib/ai/validate-quick-action-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Action IA rapide et ciblée — sur un seul champ court d'une idée de la Banque, sur le contenu
 * d'une note, ou sur un champ d'une publication en cours de rédaction (voir
 * src/lib/ai/quick-actions.ts pour les trois catalogues). Réutilise le client Anthropic serveur,
 * le rate-limit et l'authentification déjà en place pour /api/ia/generateur/topics et
 * /api/ia/atelier/generation-complete — aucun second moteur IA, une seule route pour les trois
 * familles d'actions. Ne lit ni n'écrit aucune donnée Supabase : seul le texte transmis
 * explicitement par le client est envoyé à Claude, jamais le profil complet de la marque ni
 * l'historique de conversation. */

const MAX_TOKENS_FIELD = 700;
const MAX_TOKENS_NOTE = 2500;
const MAX_TOKENS_PUBLICATION = 1200;
const MAX_ITEM_LENGTH_FIELD = 800;
const MAX_ITEM_LENGTH_NOTE = 8000;
const MAX_ITEM_LENGTH_PUBLICATION = 3000;

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
    return errorResponse("rate_limited", "Trop de demandes — réessayez dans un instant.", 429);
  }

  const rawBody = await request.json().catch(() => null);
  const rawAction = (rawBody as Record<string, unknown> | null)?.action;
  const isNoteAction = isNoteQuickActionKind(rawAction);
  const isPublicationAction = isPublicationQuickActionKind(rawAction);

  let prompt: QuickActionPrompt;
  let actionKey: string;
  let maxTokens: number;
  let maxItemLength: number;

  if (isNoteAction) {
    const validation = validateNoteQuickActionRequest(rawBody);
    if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
    prompt = buildNoteQuickActionPrompt(validation.value);
    actionKey = validation.value.action;
    maxTokens = MAX_TOKENS_NOTE;
    maxItemLength = MAX_ITEM_LENGTH_NOTE;
  } else if (isPublicationAction) {
    const validation = validatePublicationQuickActionRequest(rawBody);
    if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
    prompt = buildPublicationQuickActionPrompt(validation.value);
    actionKey = validation.value.action;
    maxTokens = MAX_TOKENS_PUBLICATION;
    maxItemLength = MAX_ITEM_LENGTH_PUBLICATION;
  } else {
    const validation = validateQuickActionRequest(rawBody);
    if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
    prompt = buildQuickActionPrompt(validation.value);
    actionKey = validation.value.action;
    maxTokens = MAX_TOKENS_FIELD;
    maxItemLength = MAX_ITEM_LENGTH_FIELD;
  }

  if (!isAnthropicConfigured()) {
    return errorResponse("not_configured", "Intégration Claude non configurée sur ce serveur.", 503);
  }

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

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }
    const items = (parsed as Record<string, unknown> | null)?.items;
    if (!Array.isArray(items) || items.length === 0 || !items.every((item) => typeof item === "string")) {
      return errorResponse("invalid_response", "Réponse Claude dans un format inattendu.", 502);
    }

    console.info("[ia/banque/quick-action] exécutée", {
      userId: user.id,
      model,
      action: actionKey,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({ status: "ok", items: items.map((item) => item.slice(0, maxItemLength)) });
  } catch (error) {
    const classified = classifyAnthropicError(error);
    if (classified.code === "unknown_error") {
      console.error("[ia/banque/quick-action] erreur inattendue", error);
    }
    return errorResponse(classified.code, classified.message, classified.status);
  }
}
