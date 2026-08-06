import { NextResponse } from "next/server";
import { isLinkedInOrganizationAccessEnabled, LINKEDIN_ORGANIZATION_SCOPES } from "@/lib/linkedin/config";
import { getValidAccessToken, saveConnection } from "@/lib/linkedin/connections";
import { isWorkspaceAdmin } from "@/lib/linkedin/workspace-guard";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/types/dashboard";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/**
 * Crée (ou met à jour) un compte affilié représentant une Page LinkedIn administrée par un
 * compte personnel déjà connecté — Phase 4. Réutilise le même jeton d'accès que le compte
 * personnel administrateur (LinkedIn ne délivre pas de jeton séparé par organisation : c'est la
 * portée `w_organization_social` sur le jeton du membre qui autorise la publication en tant
 * qu'organisation). N'écrit jamais si l'accès organisation n'est pas explicitement activé.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  if (!isLinkedInOrganizationAccessEnabled()) {
    return errorResponse("organization_access_not_enabled", "L'accès Page LinkedIn n'est pas encore activé sur ce serveur.", 501);
  }

  const body = (await request.json().catch(() => null)) as
    | { adminAccountId?: string; brandId?: string; organizationUrn?: string; organizationName?: string }
    | null;
  if (!body?.adminAccountId || !body.organizationUrn || !body.organizationName) {
    return errorResponse("invalid_request", "Compte administrateur et organisation requis.", 400);
  }

  const { data: adminRow, error: adminError } = await supabase.from("accounts").select("*").eq("id", body.adminAccountId).maybeSingle();
  if (adminError || !adminRow) return errorResponse("not_found", "Compte administrateur introuvable ou inaccessible.", 404);
  const adminAccount = mapRowToRecord(adminRow) as unknown as SocialAccount;
  const workspaceId = (adminRow as { workspace_id: string }).workspace_id;

  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) return errorResponse("forbidden", "Réservé aux administrateurs du workspace.", 403);

  const hasOrganizationScopes = LINKEDIN_ORGANIZATION_SCOPES.every((scope) => (adminAccount.oauthScopes ?? []).includes(scope));
  if (!hasOrganizationScopes) {
    return errorResponse("missing_organization_scopes", "Le compte administrateur n'a pas les permissions Page LinkedIn.", 403);
  }

  const tokenResult = await getValidAccessToken(workspaceId, adminAccount.id, adminAccount.tokenExpiresAt ?? null);
  if (!tokenResult.ok) return errorResponse("token_unavailable", "Jeton LinkedIn indisponible — reconnexion nécessaire.", 409);

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform", "linkedin")
    .eq("external_account_id", body.organizationUrn)
    .maybeSingle();

  const accountRow = {
    workspace_id: workspaceId,
    brand_id: body.brandId ?? null,
    brand: "",
    platform: "linkedin",
    account_name: body.organizationName,
    handle: body.organizationName,
    status: "connected",
    last_synced_at: now,
    last_checked_at: now,
    permissions: adminAccount.oauthScopes ?? [],
    external_account_id: body.organizationUrn,
    oauth_scopes: adminAccount.oauthScopes ?? [],
    token_expires_at: adminAccount.tokenExpiresAt ?? null,
    created_by: user.id,
  };

  let accountId: string;
  if (existing) {
    accountId = (existing as { id: string }).id;
    const { error: updateError } = await supabase.from("accounts").update(accountRow).eq("id", accountId);
    if (updateError) return errorResponse("account_save_failed", "Enregistrement de la page impossible.", 500);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("accounts")
      .insert({ id: crypto.randomUUID(), ...accountRow })
      .select("id")
      .single();
    if (insertError || !inserted) return errorResponse("account_save_failed", "Enregistrement de la page impossible.", 500);
    accountId = (inserted as { id: string }).id;
  }

  try {
    await saveConnection(workspaceId, accountId, "linkedin", {
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshed?.refreshToken ?? null,
      expiresAt: adminAccount.tokenExpiresAt ?? now,
      scopes: adminAccount.oauthScopes ?? [],
    });
  } catch {
    if (!existing) await supabase.from("accounts").delete().eq("id", accountId);
    return errorResponse("token_storage_failed", "Stockage du jeton de la page impossible.", 500);
  }

  return NextResponse.json({ status: "ok", accountId });
}
