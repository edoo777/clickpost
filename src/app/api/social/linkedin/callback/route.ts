import { NextResponse } from "next/server";
import { exchangeCodeForToken, fetchLinkedInIdentity, verifyCallbackState } from "@/lib/linkedin/oauth";
import { saveConnection } from "@/lib/linkedin/connections";
import { cacheCallbackOutcome, getCachedCallbackOutcome } from "@/lib/linkedin/callback-idempotency";
import { isWorkspaceAdmin } from "@/lib/linkedin/workspace-guard";
import { LINKEDIN_MEMBER_SCOPES } from "@/lib/linkedin/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Étape 2/2 du flux OAuth LinkedIn. Ne journalise jamais le `code` ni le jeton — voir
 * exchangeCodeForToken() pour le diagnostic temporaire (statut/erreur LinkedIn, présence et
 * longueur des identifiants, jamais leur contenu). Le `state` est revérifié (signature +
 * expiration) avant toute action — un `state` invalide ou expiré est rejeté explicitement,
 * jamais traité comme "probablement valide". L'utilisateur et son rôle admin sont revérifiés ici
 * aussi (pas seulement à l'étape /connect) : un `state` signé reste valide 10 minutes, la session
 * ou l'appartenance au workspace ont pu changer entre-temps — jamais un détournement de compte
 * via un state réutilisé après une perte de droits.
 *
 * Idempotence : le code reçu est mis en cache (en mémoire process, voir callback-idempotency.ts)
 * dès qu'il a été traité une première fois, succès ou échec — un second appel avec exactement le
 * même code (double requête navigateur, rechargement de route en développement) renvoie le même
 * résultat sans réexécuter l'échange ni retoucher la base, jamais un second compte créé pour la
 * même tentative.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (errorParam) {
    // L'utilisateur a refusé le consentement côté LinkedIn — jamais une erreur technique, un
    // retour normal du flux. Rien à mettre en cache : aucun code n'a été émis.
    return NextResponse.redirect(new URL("/comptes?linkedin_error=consent_denied", request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/comptes?linkedin_error=missing_params", request.url));
  }

  const cached = getCachedCallbackOutcome(code);
  if (cached) return NextResponse.redirect(new URL(cached, request.url));

  const resultPath = await processCallback(code, state);
  cacheCallbackOutcome(code, resultPath);
  return NextResponse.redirect(new URL(resultPath, request.url));
}

async function processCallback(code: string, state: string): Promise<string> {
  const errorPath = (reason: string) => `/comptes?linkedin_error=${reason}`;

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

  // Aucun profil local n'est créé ni modifié avant ce point : l'échange du code est la toute
  // première action pouvant échouer, et échoue ici sans toucher `accounts`.
  const tokenResult = await exchangeCodeForToken(code);
  if (!tokenResult.ok) return errorPath("token_exchange_failed");

  const identityResult = await fetchLinkedInIdentity(tokenResult.token.accessToken);
  if (!identityResult.ok) return errorPath("identity_fetch_failed");
  const { identity } = identityResult;

  const { data: brandRow } = brandId
    ? await supabase.from("brands").select("id, name").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle()
    : { data: null };
  const brandName = (brandRow as { name?: string } | null)?.name ?? "";

  const missingScopes = LINKEDIN_MEMBER_SCOPES.filter((scope) => !tokenResult.token.scopes.includes(scope));
  const status = missingScopes.length > 0 ? "insufficient_permission" : "connected";

  // Clé logique d'upsert : workspace + plateforme + identifiant de compte distant — jamais une
  // nouvelle ligne pour une identité LinkedIn déjà connue de ce workspace, quel que soit le
  // nombre de tentatives (échouées ou non).
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
    await saveConnection(workspaceId, accountId, "linkedin", tokenResult.token);
  } catch {
    // Le jeton n'a pas pu être stocké : ne jamais laisser le compte dans un état "connecté" sans
    // connexion réelle derrière. Une ligne nouvellement insérée est retirée (aucun doublon
    // orphelin) ; une ligne préexistante repasse explicitement en erreur plutôt que de garder un
    // statut "connecté" mensonger.
    if (!wasExisting) {
      await supabase.from("accounts").delete().eq("id", accountId);
    } else {
      await supabase.from("accounts").update({ status: "error" }).eq("id", accountId);
    }
    return errorPath("token_storage_failed");
  }

  return `/comptes?linkedin_connected=${accountId}`;
}
