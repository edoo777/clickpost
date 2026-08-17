import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { PROMPT_OVERRIDE_KEYS, PROMPT_OVERRIDE_LABELS, type PromptOverride, type PromptOverrideKey } from "@/lib/admin/prompt-override-types";

export type { PromptOverrideKey, PromptOverride } from "@/lib/admin/prompt-override-types";
export { PROMPT_OVERRIDE_KEYS, PROMPT_OVERRIDE_LABELS } from "@/lib/admin/prompt-override-types";

export interface PromptOverrideConfig {
  systemPromptOverride: string;
  extraInstructions: string;
}

const EMPTY_CONFIG: PromptOverrideConfig = { systemPromptOverride: "", extraInstructions: "" };

/**
 * Lecture depuis une route IA, avec la session normale de l'utilisateur appelant (jamais
 * service_role — la RLS autorise déjà la lecture à tout utilisateur authentifié, voir la
 * migration). Ne bloque jamais une génération : une erreur, une absence de ligne, ou un statut
 * inactif renvoient une configuration vide — fallback sécurisé vers le prompt codé en dur.
 *
 * IMPORTANT : ce fichier importe next/headers (via createSupabaseServerClient) — jamais depuis un
 * composant "use client" (voir prompt-override-types.ts pour les types/constantes sûrs côté
 * client).
 */
export async function getPromptOverrideConfig(key: PromptOverrideKey): Promise<PromptOverrideConfig> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("prompt_overrides")
      .select("is_active, system_prompt_override, extra_instructions")
      .eq("key", key)
      .maybeSingle();
    if (!data || data.is_active === false) return EMPTY_CONFIG;
    return {
      systemPromptOverride: ((data.system_prompt_override as string | undefined) ?? "").trim(),
      extraInstructions: ((data.extra_instructions as string | undefined) ?? "").trim(),
    };
  } catch {
    return EMPTY_CONFIG;
  }
}

/** Réservé aux routes /api/admin/**, déjà gardées par isPlatformAdminEmail() avant tout appel. */
export async function listPromptOverrides(): Promise<PromptOverride[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("prompt_overrides").select("*").in("key", PROMPT_OVERRIDE_KEYS);
  const byKey = new Map((data ?? []).map((row) => [row.key as string, row]));
  return PROMPT_OVERRIDE_KEYS.map((key) => {
    const row = byKey.get(key);
    return {
      key,
      name: (row?.name as string | undefined) || PROMPT_OVERRIDE_LABELS[key],
      isActive: (row?.is_active as boolean | undefined) ?? true,
      systemPromptOverride: (row?.system_prompt_override as string | undefined) ?? "",
      extraInstructions: (row?.extra_instructions as string | undefined) ?? "",
      previousExtraInstructions: (row?.previous_extra_instructions as string | null | undefined) ?? null,
      updatedAt: (row?.updated_at as string | undefined) ?? null,
    };
  });
}

export interface SavePromptOverrideInput {
  name: string;
  isActive: boolean;
  systemPromptOverride: string;
  extraInstructions: string;
}

export async function savePromptOverride(key: PromptOverrideKey, input: SavePromptOverrideInput, updatedBy: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase.from("prompt_overrides").select("extra_instructions").eq("key", key).maybeSingle();
  await supabase.from("prompt_overrides").upsert({
    key,
    name: input.name,
    is_active: input.isActive,
    system_prompt_override: input.systemPromptOverride,
    extra_instructions: input.extraInstructions,
    previous_extra_instructions: existing?.extra_instructions ?? null,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}

export async function restorePreviousPromptOverride(key: PromptOverrideKey, updatedBy: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase.from("prompt_overrides").select("previous_extra_instructions").eq("key", key).maybeSingle();
  if (existing?.previous_extra_instructions == null) return;
  await supabase.from("prompt_overrides").upsert({
    key,
    extra_instructions: existing.previous_extra_instructions,
    previous_extra_instructions: null,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}
