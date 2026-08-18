import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "@/lib/i18n/locale";

/**
 * Langue attendue des générations IA pour l'utilisateur authentifié courant — lue depuis
 * `profiles.ui_locale` (jamais depuis un paramètre fourni par le client, qui pourrait être
 * incohérent avec ce que l'utilisateur a réellement choisi). Repli sûr sur le français si la
 * lecture échoue ou si la valeur est absente/invalide — ne bloque jamais une génération IA.
 */
export async function getUserLocale(supabase: SupabaseClient, userId: string): Promise<Locale> {
  try {
    const { data } = await supabase.from("profiles").select("ui_locale").eq("id", userId).maybeSingle();
    const value = (data as { ui_locale?: string } | null)?.ui_locale;
    return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
