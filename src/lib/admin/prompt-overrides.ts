import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { PROMPT_OVERRIDE_KEYS, type PromptOverride, type PromptOverrideKey } from "@/lib/admin/prompt-override-types";

export type { PromptOverrideKey, PromptOverride } from "@/lib/admin/prompt-override-types";
export { PROMPT_OVERRIDE_KEYS, PROMPT_OVERRIDE_LABELS } from "@/lib/admin/prompt-override-types";

/**
 * Lecture depuis une route IA, avec la session normale de l'utilisateur appelant (jamais
 * service_role — la RLS autorise déjà la lecture à tout utilisateur authentifié, voir la
 * migration). Ne bloque jamais une génération : une erreur ou une absence de ligne renvoie une
 * chaîne vide, jamais une exception propagée jusqu'à l'appelant.
 *
 * IMPORTANT : ce fichier importe next/headers (via createSupabaseServerClient) — jamais depuis un
 * composant "use client" (voir prompt-override-types.ts pour les types/constantes sûrs côté
 * client).
 */
export async function getPromptExtraInstructions(key: PromptOverrideKey): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("prompt_overrides").select("extra_instructions").eq("key", key).maybeSingle();
    const value = data?.extra_instructions as string | undefined;
    return value?.trim() ?? "";
  } catch {
    return "";
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
      extraInstructions: (row?.extra_instructions as string | undefined) ?? "",
      previousExtraInstructions: (row?.previous_extra_instructions as string | null | undefined) ?? null,
      updatedAt: (row?.updated_at as string | undefined) ?? null,
    };
  });
}

export async function savePromptOverride(key: PromptOverrideKey, extraInstructions: string, updatedBy: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase.from("prompt_overrides").select("extra_instructions").eq("key", key).maybeSingle();
  await supabase.from("prompt_overrides").upsert({
    key,
    extra_instructions: extraInstructions,
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
