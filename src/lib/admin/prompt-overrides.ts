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
 * service_role). Passe par la fonction SECURITY DEFINER `get_active_prompt_override` (voir la
 * migration `20260817030000_prompt_overrides_restrict_select.sql`) plutôt qu'une lecture directe
 * de la table : `prompt_overrides` n'a plus aucune politique de lecture cliente — un utilisateur
 * authentifié ne peut obtenir, via cette fonction, que les deux champs nécessaires à l'injection
 * dans SON propre prompt pour une clé active, jamais le reste de la table (nom, statut,
 * historique, identifiant de l'administrateur). Ne bloque jamais une génération : une erreur, une
 * absence de ligne, ou un statut inactif renvoient une configuration vide — fallback sécurisé
 * vers le prompt codé en dur.
 *
 * IMPORTANT : ce fichier importe next/headers (via createSupabaseServerClient) — jamais depuis un
 * composant "use client" (voir prompt-override-types.ts pour les types/constantes sûrs côté
 * client).
 */
export async function getPromptOverrideConfig(key: PromptOverrideKey): Promise<PromptOverrideConfig> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.rpc("get_active_prompt_override", { p_key: key }).maybeSingle();
    const row = data as { system_prompt_override?: string; extra_instructions?: string } | null;
    if (!row) return EMPTY_CONFIG;
    return {
      systemPromptOverride: (row.system_prompt_override ?? "").trim(),
      extraInstructions: (row.extra_instructions ?? "").trim(),
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
      version: (row?.version as number | undefined) ?? 1,
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
  const { data: existing } = await supabase.from("prompt_overrides").select("extra_instructions, version").eq("key", key).maybeSingle();
  const currentVersion = (existing?.version as number | undefined) ?? 0;
  await supabase.from("prompt_overrides").upsert({
    key,
    name: input.name,
    is_active: input.isActive,
    system_prompt_override: input.systemPromptOverride,
    extra_instructions: input.extraInstructions,
    previous_extra_instructions: existing?.extra_instructions ?? null,
    version: currentVersion + 1,
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
