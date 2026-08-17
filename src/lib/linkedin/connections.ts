import { encryptToken, decryptToken } from "@/lib/oauth/token-encryption";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { refreshAccessToken, type LinkedInTokenResponse } from "@/lib/linkedin/oauth";

/**
 * Lecture/écriture de `social_connections` — exclusivement via la clé service_role (RLS sans
 * aucune politique pour `authenticated`/`anon`, voir la migration associée). N'exporte jamais un
 * jeton en clair au-delà de ce module et de ses appelants serveur directs (routes API et
 * fournisseur LinkedIn) — jamais renvoyé à l'interface, jamais journalisé.
 */

interface ConnectionRow {
  id: string;
  workspace_id: string;
  account_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
}

export async function saveConnection(
  workspaceId: string,
  accountId: string,
  platform: string,
  token: LinkedInTokenResponse
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("social_connections").upsert(
    {
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      account_id: accountId,
      platform,
      access_token_encrypted: encryptToken(token.accessToken),
      refresh_token_encrypted: token.refreshToken ? encryptToken(token.refreshToken) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id" }
  );
  if (error) throw new Error(`Écriture de la connexion impossible : ${error.message}`);
}

export async function deleteConnection(accountId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("social_connections").delete().eq("account_id", accountId);
  if (error) throw new Error(`Suppression de la connexion impossible : ${error.message}`);
}

export type AccessTokenResult =
  | {
      ok: true;
      accessToken: string;
      refreshed: LinkedInTokenResponse | null;
      /** Jeton de rafraîchissement actuellement sur le compte, qu'un rafraîchissement vienne ou
       * non d'avoir lieu — jamais seulement `refreshed?.refreshToken`, qui est `null` dans le cas
       * le plus courant (jeton pas encore expiré à l'appel). Corrige un bug réel trouvé lors d'un
       * audit autonome (2026-08-17) : connect-organization copiait `refreshed?.refreshToken` pour
       * créer le compte Page, perdant silencieusement le jeton de rafraîchissement dans le cas
       * courant et forçant la Page à une reconnexion manuelle à la première expiration, alors même
       * que le compte administrateur continuait de se rafraîchir normalement. */
      refreshToken: string | null;
    }
  | { ok: false; reason: "no_connection" | "expired_no_refresh" | "refresh_failed" };

/** Renvoie un jeton d'accès utilisable, rafraîchi automatiquement si expiré ET qu'un jeton de
 * rafraîchissement existe — sinon échoue explicitement (`expired_no_refresh`), jamais un jeton
 * expiré renvoyé comme s'il était valide. `expiresAt`/`accountId` proviennent de `accounts`
 * (métadonnées non sensibles, lues par l'appelant via le client habituel).
 *
 * Après un rafraîchissement réussi, `accounts.token_expires_at` est mis à jour ici même (au lieu
 * de laisser chaque appelant s'en charger, source d'oubli — corrige un bug réel trouvé lors d'un
 * audit autonome, 2026-08-17 : sans cette écriture, `tokenExpiresAt` restait figé sur l'ancienne
 * date, provoquant un rafraîchissement redondant à chaque publication ET un état "jeton expiré"
 * durablement affiché au tableau de bord alors même que la publication réussissait via le
 * rafraîchissement silencieux — un état de connexion malhonnête). */
export async function getValidAccessToken(
  workspaceId: string,
  accountId: string,
  tokenExpiresAt: string | null
): Promise<AccessTokenResult> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("social_connections")
    .select("*")
    .eq("account_id", accountId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "no_connection" };
  const row = data as ConnectionRow;

  const currentRefreshToken = row.refresh_token_encrypted ? decryptToken(row.refresh_token_encrypted) : null;

  const isExpired = !tokenExpiresAt || new Date(tokenExpiresAt).getTime() <= Date.now();
  if (!isExpired) {
    return { ok: true, accessToken: decryptToken(row.access_token_encrypted), refreshed: null, refreshToken: currentRefreshToken };
  }

  if (!row.refresh_token_encrypted) {
    return { ok: false, reason: "expired_no_refresh" };
  }

  const refreshed = await refreshAccessToken(decryptToken(row.refresh_token_encrypted));
  if (!refreshed.ok) return { ok: false, reason: "refresh_failed" };

  await saveConnection(workspaceId, accountId, "linkedin", refreshed.token);
  const { error: expiryUpdateError } = await supabase
    .from("accounts")
    .update({ token_expires_at: refreshed.token.expiresAt, last_checked_at: new Date().toISOString() })
    .eq("id", accountId);
  if (expiryUpdateError) {
    // Le nouveau jeton reste valide et utilisable immédiatement même si cette écriture échoue —
    // seul l'affichage de statut / le prochain appel referont un rafraîchissement inutile mais
    // sans conséquence, jamais un blocage de la publication en cours.
    console.error("[linkedin] échec de la mise à jour de token_expires_at après rafraîchissement", expiryUpdateError.message);
  }
  return {
    ok: true,
    accessToken: refreshed.token.accessToken,
    refreshed: refreshed.token,
    refreshToken: refreshed.token.refreshToken ?? currentRefreshToken,
  };
}
