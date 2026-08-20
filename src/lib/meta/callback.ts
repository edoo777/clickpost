import { exchangeCodeForLongLivedUserToken, fetchGrantedPermissions, fetchManagedPages, verifyCallbackState, type ManagedPage } from "@/lib/meta/oauth";
import { FACEBOOK_SCOPES, INSTAGRAM_SCOPES } from "@/lib/meta/config";
import { saveConnection as saveFacebookConnection } from "@/lib/facebook/connections";
import { saveConnection as saveInstagramConnection } from "@/lib/instagram/connections";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Traitement partagé du callback OAuth Meta pour Instagram et Facebook — voir
 * src/lib/meta/config.ts pour la mutualisation. La sélection des Pages à connecter se fait dans
 * la boîte de dialogue Facebook Login elle-même (l'utilisateur y choisit explicitement quelles
 * Pages autoriser) : toutes les Pages renvoyées par `/me/accounts` ont donc déjà été
 * explicitement approuvées, jamais une sélection devinée côté ClickPost. Facebook connecte une
 * ligne `accounts` par Page ; Instagram n'en connecte une que pour les Pages ayant réellement un
 * compte professionnel Instagram lié (`instagram_business_account`) — jamais une ligne fictive
 * pour une Page sans compte Instagram.
 */
export async function processMetaCallback(product: "instagram" | "facebook", code: string, state: string): Promise<string> {
  const errorPath = (reason: string) => `/comptes?${product}_error=${reason}`;

  const verification = verifyCallbackState(product, state);
  if (!verification.valid) return errorPath(`invalid_state_${verification.reason}`);
  const { workspaceId, brandId, userId } = verification.payload;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return errorPath("session_mismatch");

  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) return errorPath("forbidden");

  const tokenResult = await exchangeCodeForLongLivedUserToken(product, code);
  if (!tokenResult.ok) return `${errorPath("token_exchange_failed")}&ref=${tokenResult.correlationId}`;

  const permissionsResult = await fetchGrantedPermissions(product, tokenResult.longLivedUserToken);
  const grantedScopes = permissionsResult.ok ? permissionsResult.scopes : [];

  const pagesResult = await fetchManagedPages(product, tokenResult.longLivedUserToken);
  if (!pagesResult.ok) return errorPath("pages_fetch_failed");

  const eligiblePages = product === "instagram" ? pagesResult.pages.filter((page) => page.instagramBusinessAccountId) : pagesResult.pages;
  if (eligiblePages.length === 0) {
    return errorPath(product === "instagram" ? "no_instagram_account" : "no_page");
  }

  const { data: brandRow } = brandId
    ? await supabase.from("brands").select("id, name").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle()
    : { data: null };
  const brandName = (brandRow as { name?: string } | null)?.name ?? "";

  const requiredScopes = product === "instagram" ? INSTAGRAM_SCOPES : FACEBOOK_SCOPES;
  const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
  const status = missingScopes.length > 0 ? "insufficient_permission" : "connected";

  const connectedAccountIds: string[] = [];

  for (const page of eligiblePages) {
    const externalAccountId = product === "instagram" ? (page.instagramBusinessAccountId as string) : page.pageId;
    const accountName = product === "instagram" ? (page.instagramUsername ?? page.pageName) : page.pageName;

    const { data: existingAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("platform", product)
      .eq("external_account_id", externalAccountId)
      .maybeSingle();

    const now = new Date().toISOString();
    const accountRow = {
      workspace_id: workspaceId,
      brand_id: brandId,
      brand: brandName,
      platform: product,
      account_name: accountName,
      handle: accountName,
      status,
      last_synced_at: now,
      last_checked_at: now,
      permissions: grantedScopes,
      external_account_id: externalAccountId,
      oauth_scopes: grantedScopes,
      token_expires_at: tokenResult.expiresAt,
      platform_metadata: product === "instagram" ? { facebookPageId: page.pageId } : {},
      created_by: user.id,
    };

    const wasExisting = Boolean(existingAccount);
    let accountId: string;
    if (existingAccount) {
      accountId = (existingAccount as { id: string }).id;
      const { error: updateError } = await supabase.from("accounts").update(accountRow).eq("id", accountId);
      if (updateError) continue;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("accounts")
        .insert({ id: crypto.randomUUID(), ...accountRow })
        .select("id")
        .single();
      if (insertError || !inserted) continue;
      accountId = (inserted as { id: string }).id;
    }

    try {
      const saveFn = product === "instagram" ? saveInstagramConnection : saveFacebookConnection;
      await saveFn(workspaceId, accountId, product, {
        accessToken: page.pageAccessToken,
        refreshToken: tokenResult.longLivedUserToken,
        expiresAt: tokenResult.expiresAt,
        scopes: grantedScopes,
      });
      connectedAccountIds.push(accountId);
    } catch {
      if (!wasExisting) {
        await supabase.from("accounts").delete().eq("id", accountId);
      } else {
        await supabase.from("accounts").update({ status: "error" }).eq("id", accountId);
      }
    }
  }

  if (connectedAccountIds.length === 0) return errorPath("token_storage_failed");

  if (status === "connected") {
    await recordProductEvent(supabase, {
      eventName: "social_connected",
      userId: user.id,
      workspaceId,
      metadata: { platform: product, count: connectedAccountIds.length },
    });
  }

  return `/comptes?${product}_connected=${connectedAccountIds[0]}&count=${connectedAccountIds.length}`;
}

export type { ManagedPage };
