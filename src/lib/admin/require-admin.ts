import { isPlatformAdminEmail } from "@/lib/admin/is-platform-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAuthResult = { ok: true; userId: string; email: string } | { ok: false };

/** Deuxième vérification serveur pour chaque route /api/admin/** — jamais une confiance dans le
 * seul middleware (défense en profondeur, voir src/proxy.ts et is-platform-admin.ts). */
export async function requirePlatformAdmin(): Promise<AdminAuthResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) return { ok: false };
  return { ok: true, userId: user.id, email: user.email ?? "" };
}
