import { NextResponse } from "next/server";
import { isLinkedInOrganizationAccessEnabled, LINKEDIN_ORGANIZATION_SCOPES } from "@/lib/linkedin/config";
import { getValidAccessToken } from "@/lib/linkedin/connections";
import { fetchAdministeredOrganizations } from "@/lib/linkedin/organizations";
import { isWorkspaceAdmin } from "@/lib/linkedin/workspace-guard";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/types/dashboard";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/**
 * Liste les Pages LinkedIn administrées par le compte personnel déjà connecté `accountId` —
 * Phase 4, jamais appelée avec succès tant que LINKEDIN_ORGANIZATION_ACCESS_ENABLED n'est pas
 * explicitement activé (accès réellement approuvé par LinkedIn, jamais présumé).
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  if (!isLinkedInOrganizationAccessEnabled()) {
    return errorResponse(
      "organization_access_not_enabled",
      "L'accès Page LinkedIn n'est pas encore activé sur ce serveur (approbation LinkedIn requise).",
      501
    );
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) return errorResponse("invalid_request", "Identifiant de compte requis.", 400);

  const { data: accountRow, error: accountError } = await supabase.from("accounts").select("*").eq("id", accountId).maybeSingle();
  if (accountError || !accountRow) return errorResponse("not_found", "Compte introuvable ou inaccessible.", 404);
  const account = mapRowToRecord(accountRow) as unknown as SocialAccount;
  const workspaceId = (accountRow as { workspace_id: string }).workspace_id;

  // Lister les Pages administrées déclenche un appel réseau réel portant le jeton du compte
  // connecté — même règle que connect/connect-organization/disconnect/publish (voir
  // workspace-guard.ts) : réservé à owner/admin du workspace, jamais tout membre (corrige une
  // incohérence trouvée lors d'un audit autonome, 2026-08-17 — sans impact pratique tant que
  // LINKEDIN_ORGANIZATION_ACCESS_ENABLED reste désactivé par défaut).
  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) {
    return errorResponse("forbidden", "Seul un administrateur ou propriétaire du workspace peut lister les Pages LinkedIn.", 403);
  }

  if (account.status !== "connected") {
    return errorResponse("not_connected", "Ce compte LinkedIn personnel n'est pas connecté.", 409);
  }
  const hasOrganizationScopes = LINKEDIN_ORGANIZATION_SCOPES.every((scope) => (account.oauthScopes ?? []).includes(scope));
  if (!hasOrganizationScopes) {
    return errorResponse(
      "missing_organization_scopes",
      "Ce compte n'a pas accordé les permissions Page LinkedIn — reconnectez-le en acceptant l'accès organisation.",
      403
    );
  }

  const tokenResult = await getValidAccessToken(workspaceId, account.id, account.tokenExpiresAt ?? null);
  if (!tokenResult.ok) return errorResponse("token_unavailable", "Jeton LinkedIn indisponible — reconnexion nécessaire.", 409);

  const result = await fetchAdministeredOrganizations(tokenResult.accessToken);
  if (!result.ok) return errorResponse("linkedin_error", result.message, result.status || 502);

  return NextResponse.json({ status: "ok", organizations: result.organizations });
}
