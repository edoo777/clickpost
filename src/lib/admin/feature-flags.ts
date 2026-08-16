import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { FeatureFlag } from "@/lib/admin/feature-flag-types";

export type { FeatureFlag } from "@/lib/admin/feature-flag-types";

/**
 * Lecture publique (RLS ouverte en select) — une erreur ou une absence de ligne retombe sur
 * `false`, jamais sur `true` : une fonctionnalité non confirmée reste désactivée par défaut.
 *
 * IMPORTANT : ce fichier importe next/headers (via createSupabaseServerClient) — jamais depuis un
 * composant "use client" (voir feature-flag-types.ts pour le type sûr côté client).
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
    return Boolean(data?.enabled);
  } catch {
    return false;
  }
}

/** Réservé aux routes /api/admin/**, déjà gardées par isPlatformAdminEmail() avant tout appel. */
export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("feature_flags").select("*").order("key");
  return (data ?? []).map((row) => ({
    key: row.key as string,
    enabled: Boolean(row.enabled),
    description: (row.description as string | null | undefined) ?? null,
    updatedAt: (row.updated_at as string | undefined) ?? null,
  }));
}

export async function setFeatureFlag(key: string, enabled: boolean, updatedBy: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq("key", key);
}
