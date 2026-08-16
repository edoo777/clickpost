import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { PRODUCT_TEXT_DEFAULTS, PRODUCT_TEXT_KEYS, type ProductText, type ProductTextKey } from "@/lib/admin/product-text-keys";

export type { ProductTextKey, ProductText } from "@/lib/admin/product-text-keys";
export { PRODUCT_TEXT_DEFAULTS, PRODUCT_TEXT_KEYS, PRODUCT_TEXT_LABELS } from "@/lib/admin/product-text-keys";

/**
 * Lecture publique (RLS ouverte en select, voir la migration) — jamais bloquante : une erreur ou
 * une absence de ligne retombe silencieusement sur la valeur par défaut codée en dur.
 *
 * IMPORTANT : ce fichier importe next/headers (via createSupabaseServerClient) — jamais depuis un
 * composant "use client" (voir product-text-keys.ts pour les types/constantes sûrs côté client).
 */
export async function getProductText(key: ProductTextKey): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("product_texts").select("value").eq("key", key).maybeSingle();
    const value = data?.value as string | undefined;
    return value && value.trim().length > 0 ? value : PRODUCT_TEXT_DEFAULTS[key];
  } catch {
    return PRODUCT_TEXT_DEFAULTS[key];
  }
}

/** Réservé aux routes /api/admin/**, déjà gardées par isPlatformAdminEmail() avant tout appel. */
export async function listProductTexts(): Promise<ProductText[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("product_texts").select("*").in("key", PRODUCT_TEXT_KEYS);
  const byKey = new Map((data ?? []).map((row) => [row.key as string, row]));
  return PRODUCT_TEXT_KEYS.map((key) => {
    const row = byKey.get(key);
    return {
      key,
      value: (row?.value as string | undefined) ?? PRODUCT_TEXT_DEFAULTS[key],
      previousValue: (row?.previous_value as string | null | undefined) ?? null,
      updatedAt: (row?.updated_at as string | undefined) ?? null,
    };
  });
}

export async function saveProductText(key: ProductTextKey, value: string, updatedBy: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase.from("product_texts").select("value").eq("key", key).maybeSingle();
  await supabase.from("product_texts").upsert({
    key,
    value,
    previous_value: existing?.value ?? null,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}

export async function restorePreviousProductText(key: ProductTextKey, updatedBy: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase.from("product_texts").select("previous_value").eq("key", key).maybeSingle();
  if (existing?.previous_value == null) return;
  await supabase.from("product_texts").upsert({
    key,
    value: existing.previous_value,
    previous_value: null,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}
