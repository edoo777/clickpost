import { X_SCOPES, getXConfig } from "@/lib/x/config";
import { deriveCodeChallenge, generateCodeVerifier } from "@/lib/x/pkce";
import { createOAuthState, verifyOAuthState, type OAuthStatePayload } from "@/lib/oauth/state-token";
import type { TokenExchangeResult } from "@/lib/social/connections";

/**
 * OAuth 2.0 X (PKCE obligatoire) — documentation officielle uniquement :
 * https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/user-access-token
 * X délivre un vrai jeton de rafraîchissement si `offline.access` est accordé (voir X_SCOPES).
 */
const AUTHORIZATION_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const USERINFO_URL = "https://api.x.com/2/users/me";

function logSecureExchangeError(correlationId: string, status: number, category: string) {
  console.error(`[x-oauth] échec — réf=${correlationId} statut=${status} catégorie=${category}`);
}

/** Génère le `code_verifier` PKCE et construit l'URL d'autorisation en un seul appel — le
 * `code_verifier` fait partie du `state` signé renvoyé implicitement (voir
 * `OAuthStatePayload.codeVerifier`), jamais exposé autrement dans l'URL elle-même. */
export function buildAuthorizationUrl(payload: Omit<OAuthStatePayload, "nonce" | "issuedAt" | "codeVerifier">, scopes: string[] = X_SCOPES): string {
  const config = getXConfig();
  if (!config) throw new Error("Intégration X non configurée.");
  const codeVerifier = generateCodeVerifier();
  const state = createOAuthState({ ...payload, codeVerifier }, config.clientSecret);

  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", deriveCodeChallenge(codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type StateVerificationResult =
  | { valid: true; payload: OAuthStatePayload }
  | { valid: false; reason: "malformed" | "invalid_signature" | "expired" | "not_configured" };

export function verifyCallbackState(state: string): StateVerificationResult {
  const config = getXConfig();
  if (!config) return { valid: false, reason: "not_configured" };
  return verifyOAuthState(state, config.clientSecret);
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

interface XTokenPayload {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

async function requestToken(body: URLSearchParams, correlationId: string): Promise<TokenExchangeResult> {
  const config = getXConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration X non configurée.", category: "not_configured", correlationId };
  }

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(config.clientId, config.clientSecret),
      },
      body: body.toString(),
    });
  } catch {
    logSecureExchangeError(correlationId, 0, "network_unreachable");
    return { ok: false, status: 0, message: "X injoignable (réseau).", category: "network_unreachable", correlationId };
  }

  const data = (await response.json().catch(() => ({}))) as XTokenPayload;
  if (!response.ok || data.error) {
    const category = data.error ?? "x_rejected";
    logSecureExchangeError(correlationId, response.status, category);
    return { ok: false, status: response.status, message: `Échange refusé par X (${response.status}).`, category, correlationId };
  }

  return {
    ok: true,
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(" ").map((scope) => scope.trim()) : X_SCOPES,
    },
  };
}

export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getXConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration X non configurée.", category: "not_configured", correlationId };
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    client_id: config.clientId,
  });
  return requestToken(body, correlationId);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getXConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration X non configurée.", category: "not_configured", correlationId };
  }
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: config.clientId });
  return requestToken(body, correlationId);
}

export interface XIdentity {
  externalAccountId: string;
  name: string;
  handle: string;
}

export type IdentityFetchResult = { ok: true; identity: XIdentity } | { ok: false; status: number; message: string };

export async function fetchXIdentity(accessToken: string): Promise<IdentityFetchResult> {
  let response: Response;
  try {
    response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch {
    return { ok: false, status: 0, message: "X injoignable (réseau)." };
  }
  if (!response.ok) return { ok: false, status: response.status, message: `Identité X inaccessible (${response.status}).` };
  const data = (await response.json()) as { data?: { id: string; name?: string; username?: string } };
  if (!data.data) return { ok: false, status: response.status, message: "Réponse X inattendue (identité)." };
  return {
    ok: true,
    identity: { externalAccountId: data.data.id, name: data.data.name ?? "Compte X", handle: data.data.username ? `@${data.data.username}` : "" },
  };
}
