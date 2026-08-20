import { NextResponse } from "next/server";
import { deleteConnection } from "@/lib/youtube/connections";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const rawBody = await request.json().catch(() => null);
  const accountId = (rawBody as { accountId?: unknown } | null)?.accountId;
  if (typeof accountId !== "string" || accountId.length === 0) {
    return errorResponse("invalid_request", "Identifiant de compte requis.", 400);
  }

  const { data: account, error: accountError } = await supabase.from("accounts").select("id, workspace_id, platform").eq("id", accountId).single();
  if (accountError || !account) return errorResponse("not_found", "Compte introuvable ou inaccessible.", 404);

  const row = account as { id: string; workspace_id: string; platform: string };
  if (row.platform !== "youtube") return errorResponse("invalid_request", "Ce compte n'est pas un compte YouTube.", 400);

  const admin = await isWorkspaceAdmin(supabase, row.workspace_id, user.id);
  if (!admin) return errorResponse("forbidden", "Seuls les administrateurs du workspace peuvent déconnecter un compte.", 403);

  try {
    await deleteConnection(accountId);
  } catch {
    return errorResponse("storage_error", "Suppression du jeton impossible.", 500);
  }

  const { error: updateError } = await supabase
    .from("accounts")
    .update({ status: "profile_only", external_account_id: null, oauth_scopes: [], token_expires_at: null, last_checked_at: new Date().toISOString() })
    .eq("id", accountId);
  if (updateError) return errorResponse("account_update_failed", "Compte déconnecté mais son état local n'a pas pu être mis à jour.", 500);

  return NextResponse.json({ status: "ok" });
}
