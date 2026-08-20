import { NextResponse } from "next/server";
import { X_SCOPES } from "@/lib/x/config";
import { exchangeCodeForToken, fetchXIdentity, verifyCallbackState } from "@/lib/x/oauth";
import { saveConnection } from "@/lib/x/connections";
import { cacheCallbackOutcome, getCachedCallbackOutcome } from "@/lib/social/callback-idempotency";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Étape 2/2 du flux OAuth X — `code_verifier` récupéré depuis le `state` signé (PKCE, voir
 * src/lib/x/pkce.ts), jamais depuis un stockage serveur séparé. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (errorParam) {
    return NextResponse.redirect(new URL("/comptes?x_error=consent_denied", request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/comptes?x_error=missing_params", request.url));
  }

  const cached = getCachedCallbackOutcome("x", code);
  if (cached) return NextResponse.redirect(new URL(cached, request.url));

  const resultPath = await processCallback(code, state);
  cacheCallbackOutcome("x", code, resultPath);
  return NextResponse.redirect(new URL(resultPath, request.url));
}

async function processCallback(code: string, state: string): Promise<string> {
  const errorPath = (reason: string) => `/comptes?x_error=${reason}`;

  const verification = verifyCallbackState(state);
  if (!verification.valid) return errorPath(`invalid_state_${verification.reason}`);
  const { workspaceId, brandId, userId, codeVerifier } = verification.payload;
  if (!codeVerifier) return errorPath("missing_code_verifier");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return errorPath("session_mismatch");

  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) return errorPath("forbidden");

  const tokenResult = await exchangeCodeForToken(code, codeVerifier);
  if (!tokenResult.ok) return `${errorPath("token_exchange_failed")}&ref=${tokenResult.correlationId}`;

  const identityResult = await fetchXIdentity(tokenResult.token.accessToken);
  if (!identityResult.ok) return errorPath("identity_fetch_failed");
  const { identity } = identityResult;

  const { data: brandRow } = brandId
    ? await supabase.from("brands").select("id, name").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle()
    : { data: null };
  const brandName = (brandRow as { name?: string } | null)?.name ?? "";

  const missingScopes = X_SCOPES.filter((scope) => !tokenResult.token.scopes.includes(scope));
  const status = missingScopes.length > 0 ? "insufficient_permission" : "connected";

  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform", "x")
    .eq("external_account_id", identity.externalAccountId)
    .maybeSingle();

  const now = new Date().toISOString();
  const accountRow = {
    workspace_id: workspaceId,
    brand_id: brandId,
    brand: brandName,
    platform: "x",
    account_name: identity.name,
    handle: identity.handle || identity.name,
    status,
    last_synced_at: now,
    last_checked_at: now,
    permissions: tokenResult.token.scopes,
    external_account_id: identity.externalAccountId,
    oauth_scopes: tokenResult.token.scopes,
    token_expires_at: tokenResult.token.expiresAt,
    created_by: user.id,
  };

  const wasExisting = Boolean(existingAccount);
  let accountId: string;
  if (existingAccount) {
    accountId = (existingAccount as { id: string }).id;
    const { error: updateError } = await supabase.from("accounts").update(accountRow).eq("id", accountId);
    if (updateError) return errorPath("account_save_failed");
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("accounts")
      .insert({ id: crypto.randomUUID(), ...accountRow })
      .select("id")
      .single();
    if (insertError || !inserted) return errorPath("account_save_failed");
    accountId = (inserted as { id: string }).id;
  }

  try {
    await saveConnection(workspaceId, accountId, "x", tokenResult.token);
  } catch {
    if (!wasExisting) {
      await supabase.from("accounts").delete().eq("id", accountId);
    } else {
      await supabase.from("accounts").update({ status: "error" }).eq("id", accountId);
    }
    return errorPath("token_storage_failed");
  }

  if (status === "connected") {
    await recordProductEvent(supabase, { eventName: "social_connected", userId: user.id, workspaceId, metadata: { platform: "x" } });
  }

  return `/comptes?x_connected=${accountId}`;
}
