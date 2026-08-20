import { YOUTUBE_SCOPES, getYouTubeConfig } from "@/lib/youtube/config";
import { createOAuthState, verifyOAuthState, type OAuthStatePayload } from "@/lib/oauth/state-token";
import type { TokenExchangeResult } from "@/lib/social/connections";

/**
 * OAuth 2.0 Google (YouTube Data API v3) — documentation officielle uniquement :
 * https://developers.google.com/identity/protocols/oauth2/web-server
 * `access_type=offline`+`prompt=consent` garantissent la délivrance d'un `refresh_token` même si
 * l'utilisateur a déjà autorisé l'application par le passé (sans `prompt=consent`, Google
 * n'émet un refresh_token qu'à la toute première autorisation).
 */
const AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

function logSecureExchangeError(correlationId: string, status: number, category: string) {
  console.error(`[youtube-oauth] échec — réf=${correlationId} statut=${status} catégorie=${category}`);
}

export function buildAuthorizationUrl(payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">, scopes: string[] = YOUTUBE_SCOPES): string {
  const config = getYouTubeConfig();
  if (!config) throw new Error("Intégration YouTube non configurée.");
  const state = createOAuthState(payload, config.clientSecret);
  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export type StateVerificationResult =
  | { valid: true; payload: OAuthStatePayload }
  | { valid: false; reason: "malformed" | "invalid_signature" | "expired" | "not_configured" };

export function verifyCallbackState(state: string): StateVerificationResult {
  const config = getYouTubeConfig();
  if (!config) return { valid: false, reason: "not_configured" };
  return verifyOAuthState(state, config.clientSecret);
}

interface GoogleTokenPayload {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

async function requestToken(body: URLSearchParams, correlationId: string): Promise<TokenExchangeResult> {
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  } catch {
    logSecureExchangeError(correlationId, 0, "network_unreachable");
    return { ok: false, status: 0, message: "Google injoignable (réseau).", category: "network_unreachable", correlationId };
  }

  const data = (await response.json().catch(() => ({}))) as GoogleTokenPayload;
  if (!response.ok || data.error) {
    const category = data.error ?? "google_rejected";
    logSecureExchangeError(correlationId, response.status, category);
    return { ok: false, status: response.status, message: `Échange refusé par Google (${response.status}).`, category, correlationId };
  }

  return {
    ok: true,
    token: {
      accessToken: data.access_token,
      // Google ne renvoie un `refresh_token` qu'à la toute première autorisation (voir
      // `prompt=consent` ci-dessus) — absent lors d'un rafraîchissement normal, jamais traité
      // comme une perte : l'appelant (src/lib/youtube/connections.ts) réutilise systématiquement
      // le refresh_token déjà stocké dans ce cas (voir `refreshToken ?? currentRefreshToken` dans
      // src/lib/social/connections.ts).
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(" ").map((scope) => scope.trim()) : YOUTUBE_SCOPES,
    },
  };
}

export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getYouTubeConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration YouTube non configurée.", category: "not_configured", correlationId };
  }
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });
  return requestToken(body, correlationId);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getYouTubeConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration YouTube non configurée.", category: "not_configured", correlationId };
  }
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });
  const result = await requestToken(body, correlationId);
  if (!result.ok) return result;
  // Voir le commentaire dans requestToken : préserver le refresh_token d'origine si Google n'en
  // renvoie pas un nouveau, jamais `null` écrasant silencieusement un jeton encore valide.
  return { ok: true, token: { ...result.token, refreshToken: result.token.refreshToken ?? refreshToken } };
}

export interface YouTubeIdentity {
  externalAccountId: string;
  name: string;
  handle: string | null;
}

export type IdentityFetchResult = { ok: true; identity: YouTubeIdentity } | { ok: false; status: number; message: string };

/** Chaîne YouTube associée au compte Google connecté — une seule chaîne par compte dans
 * l'immense majorité des cas (`mine=true`), jamais une liste de chaînes gérées comme pour les
 * Pages Meta. */
export async function fetchYouTubeIdentity(accessToken: string): Promise<IdentityFetchResult> {
  const url = new URL(CHANNELS_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("mine", "true");
  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch {
    return { ok: false, status: 0, message: "YouTube injoignable (réseau)." };
  }
  if (!response.ok) return { ok: false, status: response.status, message: `Identité YouTube inaccessible (${response.status}).` };
  const data = (await response.json()) as { items?: { id: string; snippet?: { title?: string; customUrl?: string } }[] };
  const channel = data.items?.[0];
  if (!channel) return { ok: false, status: response.status, message: "Aucune chaîne YouTube trouvée pour ce compte Google." };
  return {
    ok: true,
    identity: { externalAccountId: channel.id, name: channel.snippet?.title ?? "Chaîne YouTube", handle: channel.snippet?.customUrl ?? null },
  };
}
