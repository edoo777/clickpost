import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Tarifs indicatifs par million de tokens (USD), tirés de la documentation publique Anthropic au
 * moment de l'écriture — à revérifier/ajuster manuellement si Anthropic modifie ses prix. Sert
 * uniquement à une ESTIMATION affichée dans l'Admin (jamais une facturation réelle), calculée
 * uniquement à partir de tokens réellement consommés par un appel Claude déjà effectué — jamais un
 * coût deviné a priori. Le modèle par défaut couvre tout modèle absent de cette table.
 */
const PRICE_PER_MILLION_TOKENS_USD: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-opus-5": { input: 15, output: 75 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  default: { input: 3, output: 15 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICE_PER_MILLION_TOKENS_USD[model] ?? PRICE_PER_MILLION_TOKENS_USD.default;
  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
}

export interface RecordAiUsageInput {
  workspaceId: string;
  userId: string;
  /** Identifie la fonctionnalité d'origine (ex. "copilot", "atelier.generation_complete") —
   * jamais le chemin de route brut, pour rester stable si les routes sont réorganisées. */
  featureKey: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Journalise un appel Claude réellement effectué — à appeler UNIQUEMENT après une réponse Anthropic
 * réussie, jamais avant ni en cas d'échec (voir checkAiQuota() pour le contrôle a priori). Ne
 * bloque et ne fait jamais échouer la requête appelante : une erreur d'écriture ici ne doit jamais
 * empêcher l'utilisateur de recevoir la génération qu'il vient de payer en tokens réels.
 */
export async function recordAiUsage(
  supabase: SupabaseClient,
  input: RecordAiUsageInput
): Promise<void> {
  try {
    await supabase.from("ai_usage_events").insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      feature_key: input.featureKey,
      model: input.model,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      estimated_cost_usd: estimateCostUsd(input.model, input.inputTokens, input.outputTokens),
    });
  } catch (error) {
    console.warn("[ai/usage-tracking] échec d'enregistrement (non bloquant)", error);
  }
}
