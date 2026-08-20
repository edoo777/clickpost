import { encryptToken, decryptToken } from "@/lib/oauth/token-encryption";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Lecture/écriture générique de `social_connections`, partagée par toutes les intégrations
 * sociales réelles (Instagram, Facebook, TikTok, X, YouTube — LinkedIn garde sa propre copie
 * historique dans `src/lib/linkedin/connections.ts`, jamais touchée ici, pour ne jamais risquer
 * de casser la seule intégration déjà en production). Exclusivement via la clé service_role
 * (RLS sans aucune politique pour `authenticated`/`anon`, voir la migration
 * 20260803194148_linkedin_oauth_connections.sql — la table `social_connections` a toujours été
 * générique par plateforme : colonne `platform text not null`, jamais un schéma LinkedIn
 * uniquement). N'exporte jamais un jeton en clair au-delà de ce module et de ses appelants
 * serveur directs — jamais renvoyé à l'interface, jamais journalisé.
 */

export interface SocialTokenResponse {
  accessToken: string;
  /** Absent si la plateforme n'a pas délivré de jeton de rafraîchissement (ex. Meta Graph API :
   * pas de jeton de rafraîchissement séparé, seulement une prolongation du jeton courant tant
   * qu'il reste valide) — jamais un rafraîchissement silencieux inventé dans ce cas. */
  refreshToken: string | null;
  expiresAt: string;
  scopes: string[];
}

export type TokenExchangeResult =
  | { ok: true; token: SocialTokenResponse }
  | { ok: false; status: number; message: string; category: string; correlationId: string };

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
  token: SocialTokenResponse
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
      refreshed: SocialTokenResponse | null;
      /** Jeton de rafraîchissement actuellement sur le compte, qu'un rafraîchissement vienne ou
       * non d'avoir lieu — jamais seulement `refreshed?.refreshToken` (voir le bug corrigé sur
       * LinkedIn, même principe appliqué ici dès le départ). */
      refreshToken: string | null;
    }
  | { ok: false; reason: "no_connection" | "expired_no_refresh" | "refresh_failed" };

/** Renvoie un jeton d'accès utilisable, rafraîchi automatiquement si expiré ET qu'un jeton de
 * rafraîchissement existe — sinon échoue explicitement (`expired_no_refresh`), jamais un jeton
 * expiré renvoyé comme s'il était valide. `refreshFn` est fourni par chaque plateforme (son
 * propre `refreshAccessToken`) : cette fonction ne connaît aucun détail spécifique à une
 * plateforme, uniquement l'orchestration commune (déchiffrement, décision, réécriture). */
export async function getValidAccessToken(
  workspaceId: string,
  accountId: string,
  tokenExpiresAt: string | null,
  platform: string,
  refreshFn: (refreshToken: string) => Promise<TokenExchangeResult>
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

  const refreshed = await refreshFn(decryptToken(row.refresh_token_encrypted));
  if (!refreshed.ok) return { ok: false, reason: "refresh_failed" };

  await saveConnection(workspaceId, accountId, platform, refreshed.token);
  const { error: expiryUpdateError } = await supabase
    .from("accounts")
    .update({ token_expires_at: refreshed.token.expiresAt, last_checked_at: new Date().toISOString() })
    .eq("id", accountId);
  if (expiryUpdateError) {
    console.error(`[social:${platform}] échec de la mise à jour de token_expires_at après rafraîchissement`, expiryUpdateError.message);
  }
  return {
    ok: true,
    accessToken: refreshed.token.accessToken,
    refreshed: refreshed.token,
    refreshToken: refreshed.token.refreshToken ?? currentRefreshToken,
  };
}
