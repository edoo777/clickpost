import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Vérifie que l'utilisateur authentifié est Owner ou Admin du workspace donné — connecter ou
 * déconnecter un compte social réel reste une action structurante réservée à ces rôles. Copie
 * générique de `src/lib/linkedin/workspace-guard.ts` (logique déjà indépendante de LinkedIn) —
 * dupliquée plutôt que réutilisée directement depuis le dossier `linkedin/` pour ne jamais faire
 * dépendre une nouvelle intégration (Instagram, Facebook, TikTok, X, YouTube) d'un module nommé
 * d'après une plateforme différente, et pour ne jamais risquer de casser LinkedIn en le touchant.
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
