import { NextResponse } from "next/server";
import { TIKTOK_SCOPES } from "@/lib/tiktok/config";
import { exchangeCodeForToken, fetchTikTokIdentity, verifyCallbackState } from "@/lib/tiktok/oauth";
import { saveConnection } from "@/lib/tiktok/connections";
import { cacheCallbackOutcome, getCachedCallbackOutcome } from "@/lib/social/callback-idempotency";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Étape 2/2 du flux OAuth TikTok — voir src/app/api/social/linkedin/callback/route.ts pour
 * l'implémentation de référence dont celle-ci s'inspire directement (mêmes garde-fous). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (errorParam) {
    return NextResponse.redirect(new URL("/comptes?tiktok_error=consent_denied", request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/comptes?tiktok_error=missing_params", request.url));
  }

  const cached = getCachedCallbackOutcome("tiktok", code);
  if (cached) return NextResponse.redirect(new URL(cached, request.url));

  const resultPath = await processCallback(code, state);
  cacheCallbackOutcome("tiktok", code, resultPath);
  return NextResponse.redirect(new URL(resultPath, request.url));
}

async function processCallback(code: string, state: string): Promise<string> {
  const errorPath = (reason: string) => `/comptes?tiktok_error=${reason}`;

  const verification = verifyCallbackState(state);
  if (!verification.valid) return errorPath(`invalid_state_${verification.reason}`);
  const { workspaceId, brandId, userId } = verification.payload;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return errorPath("session_mismatch");

  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) return errorPath("forbidden");

  const tokenResult = await exchangeCodeForToken(code);
  if (!tokenResult.ok) return `${errorPath("token_exchange_failed")}&ref=${tokenResult.correlationId}`;

  const identityResult = await fetchTikTokIdentity(tokenResult.token.accessToken);
  if (!identityResult.ok) return errorPath("identity_fetch_failed");
  const { identity } = identityResult;

  const { data: brandRow } = brandId
    ? await supabase.from("brands").select("id, name").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle()
    : { data: null };
  const brandName = (brandRow as { name?: string } | null)?.name ?? "";

  const missingScopes = TIKTOK_SCOPES.filter((scope) => !tokenResult.token.scopes.includes(scope));
  const status = missingScopes.length > 0 ? "insufficient_permission" : "connected";

  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform", "tiktok")
    .eq("external_account_id", identity.externalAccountId)
    .maybeSingle();

  const now = new Date().toISOString();
  const accountRow = {
    workspace_id: workspaceId,
    brand_id: brandId,
    brand: brandName,
    platform: "tiktok",
    account_name: identity.name,
    handle: identity.name,
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
    await saveConnection(workspaceId, accountId, "tiktok", tokenResult.token);
  } catch {
    if (!wasExisting) {
      await supabase.from("accounts").delete().eq("id", accountId);
    } else {
      await supabase.from("accounts").update({ status: "error" }).eq("id", accountId);
    }
    return errorPath("token_storage_failed");
  }

  if (status === "connected") {
    await recordProductEvent(supabase, { eventName: "social_connected", userId: user.id, workspaceId, metadata: { platform: "tiktok" } });
  }

  return `/comptes?tiktok_connected=${accountId}`;
}
