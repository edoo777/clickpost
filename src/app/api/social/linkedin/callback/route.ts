import { NextResponse } from "next/server";
import { exchangeCodeForToken, fetchLinkedInIdentity, verifyCallbackState } from "@/lib/linkedin/oauth";
import { saveConnection } from "@/lib/linkedin/connections";
import { isWorkspaceAdmin } from "@/lib/linkedin/workspace-guard";
import { LINKEDIN_MEMBER_SCOPES } from "@/lib/linkedin/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Étape 2/2 du flux OAuth LinkedIn. Ne journalise jamais le `code` ni le jeton. Le `state` est
 * revérifié (signature + expiration) avant toute action — un `state` invalide ou expiré est
 * rejeté explicitement, jamais traité comme "probablement valide". L'utilisateur et son rôle
 * admin sont revérifiés ici aussi (pas seulement à l'étape /connect) : un `state` signé reste
 * valide 10 minutes, la session ou l'appartenance au workspace ont pu changer entre-temps —
 * jamais un détournement de compte via un state réutilisé après une perte de droits.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const redirectWithError = (reason: string) => NextResponse.redirect(new URL(`/comptes?linkedin_error=${reason}`, request.url));

  if (errorParam) {
    // L'utilisateur a refusé le consentement côté LinkedIn — jamais une erreur technique, un
    // retour normal du flux.
    return redirectWithError("consent_denied");
  }
  if (!code || !state) return redirectWithError("missing_params");

  const verification = verifyCallbackState(state);
  if (!verification.valid) return redirectWithError(`invalid_state_${verification.reason}`);
  const { workspaceId, brandId, userId } = verification.payload;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return redirectWithError("session_mismatch");

  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) return redirectWithError("forbidden");

  const tokenResult = await exchangeCodeForToken(code);
  if (!tokenResult.ok) return redirectWithError("token_exchange_failed");

  const identityResult = await fetchLinkedInIdentity(tokenResult.token.accessToken);
  if (!identityResult.ok) return redirectWithError("identity_fetch_failed");
  const { identity } = identityResult;

  const { data: brandRow } = brandId ? await supabase.from("brands").select("id, name").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle() : { data: null };
  const brandName = (brandRow as { name?: string } | null)?.name ?? "";

  const missingScopes = LINKEDIN_MEMBER_SCOPES.filter((scope) => !tokenResult.token.scopes.includes(scope));
  const status = missingScopes.length > 0 ? "insufficient_permission" : "connected";

  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform", "linkedin")
    .eq("external_account_id", identity.externalAccountId)
    .maybeSingle();

  const now = new Date().toISOString();
  const accountRow = {
    workspace_id: workspaceId,
    brand_id: brandId,
    brand: brandName,
    platform: "linkedin",
    account_name: identity.name,
    handle: identity.email ?? identity.name,
    status,
    last_synced_at: now,
    last_checked_at: now,
    permissions: tokenResult.token.scopes,
    external_account_id: identity.externalAccountId,
    oauth_scopes: tokenResult.token.scopes,
    token_expires_at: tokenResult.token.expiresAt,
    created_by: user.id,
  };

  let accountId: string;
  if (existingAccount) {
    accountId = (existingAccount as { id: string }).id;
    const { error: updateError } = await supabase.from("accounts").update(accountRow).eq("id", accountId);
    if (updateError) return redirectWithError("account_save_failed");
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("accounts")
      .insert({ id: crypto.randomUUID(), ...accountRow })
      .select("id")
      .single();
    if (insertError || !inserted) return redirectWithError("account_save_failed");
    accountId = (inserted as { id: string }).id;
  }

  try {
    await saveConnection(workspaceId, accountId, "linkedin", tokenResult.token);
  } catch {
    return redirectWithError("token_storage_failed");
  }

  return NextResponse.redirect(new URL(`/comptes?linkedin_connected=${accountId}`, request.url));
}
