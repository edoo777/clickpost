import { TIKTOK_SCOPES, getTikTokConfig } from "@/lib/tiktok/config";
import { createOAuthState, verifyOAuthState, type OAuthStatePayload } from "@/lib/oauth/state-token";
import type { TokenExchangeResult } from "@/lib/social/connections";

/**
 * OAuth 2.0 TikTok (Login Kit) — documentation officielle uniquement :
 * https://developers.tiktok.com/doc/oauth-user-access-token-management
 * Contrairement à Meta, TikTok délivre un véritable jeton de rafraîchissement dédié
 * (`refresh_token`, valable ~365 jours), au même principe que LinkedIn.
 */
const AUTHORIZATION_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

function logSecureExchangeError(correlationId: string, status: number, category: string) {
  console.error(`[tiktok-oauth] échec — réf=${correlationId} statut=${status} catégorie=${category}`);
}

export function buildAuthorizationUrl(payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">, scopes: string[] = TIKTOK_SCOPES): string {
  const config = getTikTokConfig();
  if (!config) throw new Error("Intégration TikTok non configurée.");
  const state = createOAuthState(payload, config.clientSecret);
  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set("client_key", config.clientKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(","));
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export type StateVerificationResult =
  | { valid: true; payload: OAuthStatePayload }
  | { valid: false; reason: "malformed" | "invalid_signature" | "expired" | "not_configured" };

export function verifyCallbackState(state: string): StateVerificationResult {
  const config = getTikTokConfig();
  if (!config) return { valid: false, reason: "not_configured" };
  return verifyOAuthState(state, config.clientSecret);
}

interface TikTokTokenPayload {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  open_id?: string;
  error?: string;
  error_description?: string;
}

async function requestToken(body: URLSearchParams, correlationId: string): Promise<TokenExchangeResult> {
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
      body: body.toString(),
    });
  } catch {
    logSecureExchangeError(correlationId, 0, "network_unreachable");
    return { ok: false, status: 0, message: "TikTok injoignable (réseau).", category: "network_unreachable", correlationId };
  }

  const data = (await response.json().catch(() => ({}))) as TikTokTokenPayload;

  if (!response.ok || data.error) {
    const category = data.error ?? "tiktok_rejected";
    logSecureExchangeError(correlationId, response.status, category);
    return { ok: false, status: response.status, message: `Échange refusé par TikTok (${response.status}).`, category, correlationId };
  }

  return {
    ok: true,
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(",").map((scope) => scope.trim()) : TIKTOK_SCOPES,
    },
  };
}

export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getTikTokConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration TikTok non configurée.", category: "not_configured", correlationId };
  }
  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });
  return requestToken(body, correlationId);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getTikTokConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration TikTok non configurée.", category: "not_configured", correlationId };
  }
  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return requestToken(body, correlationId);
}

export interface TikTokIdentity {
  externalAccountId: string;
  name: string;
  avatarUrl: string | null;
}

export type IdentityFetchResult = { ok: true; identity: TikTokIdentity } | { ok: false; status: number; message: string };

export async function fetchTikTokIdentity(accessToken: string): Promise<IdentityFetchResult> {
  const url = new URL(USERINFO_URL);
  url.searchParams.set("fields", "open_id,display_name,avatar_url");
  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch {
    return { ok: false, status: 0, message: "TikTok injoignable (réseau)." };
  }
  if (!response.ok) return { ok: false, status: response.status, message: `Identité TikTok inaccessible (${response.status}).` };
  const data = (await response.json()) as { data?: { user?: { open_id: string; display_name?: string; avatar_url?: string } } };
  const account = data.data?.user;
  if (!account) return { ok: false, status: response.status, message: "Réponse TikTok inattendue (identité)." };
  return {
    ok: true,
    identity: { externalAccountId: account.open_id, name: account.display_name ?? "Compte TikTok", avatarUrl: account.avatar_url ?? null },
  };
}
