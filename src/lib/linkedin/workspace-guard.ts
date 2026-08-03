import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Vérifie que l'utilisateur authentifié est Owner ou Admin du workspace donné — connecter ou
 * déconnecter un compte social réel reste une action structurante réservée à ces rôles (la RLS de
 * `accounts` autorise déjà tout membre pour les comptes `profile_only` existants ; cette
 * vérification applicative supplémentaire ne relâche jamais la RLS, elle ajoute une restriction
 * au-dessus, spécifique aux actions OAuth réelles).
 */
export async function isWorkspaceAdmin(supabase: SupabaseClient, workspaceId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  return role === "owner" || role === "admin";
}
