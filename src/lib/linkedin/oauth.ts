import { LINKEDIN_MEMBER_SCOPES, getLinkedInConfig } from "@/lib/linkedin/config";
import { createOAuthState, verifyOAuthState, type OAuthStatePayload } from "@/lib/oauth/state-token";

const AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export interface LinkedInTokenResponse {
  accessToken: string;
  /** Absent si LinkedIn n'a pas accordé de jeton de rafraîchissement — l'application doit alors
   * avoir été approuvée pour les "Programmatic Refresh Tokens" ; sans cela, une reconnexion
   * complète est nécessaire à l'expiration, jamais un rafraîchissement silencieux inventé. */
  refreshToken: string | null;
  expiresAt: string;
  /** Portées réellement accordées, telles que renvoyées par LinkedIn — jamais celles demandées
   * par supposition (LinkedIn peut accorder un sous-ensemble). */
  scopes: string[];
}

export interface LinkedInIdentity {
  externalAccountId: string;
  name: string;
  email: string | null;
  profileUrl: string | null;
}

function buildRedirectAndState(payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">) {
  const config = getLinkedInConfig();
  if (!config) throw new Error("Intégration LinkedIn non configurée.");
  const state = createOAuthState(payload, config.clientSecret);
  return { config, state };
}

/** Construit l'URL de redirection vers LinkedIn — jamais appelée si `getLinkedInConfig()` est
 * `null` (l'appelant doit vérifier `isLinkedInOAuthConfigured()` avant). `scopes` par défaut aux
 * portées minimales du membre ; le flux Page Entreprise (Phase 4) passe la liste étendue
 * uniquement lorsque `isLinkedInOrganizationAccessEnabled()` est vrai côté appelant — jamais
 * demandée par défaut. */
export function buildAuthorizationUrl(
  payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">,
  scopes: string[] = LINKEDIN_MEMBER_SCOPES
): string {
  const { config, state } = buildRedirectAndState(payload);
  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes.join(" "));
  return url.toString();
}

export type StateVerificationResult =
  | { valid: true; payload: OAuthStatePayload }
  | { valid: false; reason: "malformed" | "invalid_signature" | "expired" | "not_configured" };

export function verifyCallbackState(state: string): StateVerificationResult {
  const config = getLinkedInConfig();
  if (!config) return { valid: false, reason: "not_configured" };
  return verifyOAuthState(state, config.clientSecret);
}

export type TokenExchangeResult =
  | { ok: true; token: LinkedInTokenResponse }
  | { ok: false; status: number; message: string; category: string; correlationId: string };

/** Journal sécurisé, permanent — uniquement code HTTP, catégorie d'erreur (code OAuth standard
 * type `invalid_client`, jamais la description détaillée de LinkedIn qui peut varier), message
 * non sensible, et un identifiant de corrélation à usage interne. Jamais de secret, de code
 * OAuth, de jeton, d'en-tête ou de corps de réponse complet. */
function logSecureExchangeError(correlationId: string, status: number, category: string) {
  console.error(`[linkedin-oauth] échec d'échange de code — réf=${correlationId} statut=${status} catégorie=${category}`);
}

/** Échange le code d'autorisation contre un jeton — appelé uniquement côté serveur (route
 * callback), jamais depuis le navigateur. Ne journalise jamais le code, le client secret, ni le
 * jeton — voir logSecureExchangeError(). */
export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getLinkedInConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration LinkedIn non configurée.", category: "not_configured", correlationId };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    logSecureExchangeError(correlationId, 0, "network_unreachable");
    return { ok: false, status: 0, message: "LinkedIn injoignable (réseau).", category: "network_unreachable", correlationId };
  }

  if (!response.ok) {
    let category = "linkedin_rejected";
    try {
      const parsed = (await response.json()) as { error?: string };
      if (parsed.error) category = parsed.error;
    } catch {
      // Corps non-JSON — catégorie générique conservée, jamais le corps journalisé.
    }
    logSecureExchangeError(correlationId, response.status, category);
    return {
      ok: false,
      status: response.status,
      message: `Échange du code refusé par LinkedIn (${response.status}).`,
      category,
      correlationId,
    };
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
  };

  return {
    ok: true,
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(",").map((scope) => scope.trim()) : LINKEDIN_MEMBER_SCOPES,
    },
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getLinkedInConfig();
  if (!config) {
    logSecureExchangeError(correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration LinkedIn non configurée.", category: "not_configured", correlationId };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    logSecureExchangeError(correlationId, 0, "network_unreachable");
    return { ok: false, status: 0, message: "LinkedIn injoignable (réseau).", category: "network_unreachable", correlationId };
  }

  if (!response.ok) {
    let category = "linkedin_rejected";
    try {
      const parsed = (await response.json()) as { error?: string };
      if (parsed.error) category = parsed.error;
    } catch {
      // Corps non-JSON — catégorie générique conservée, jamais le corps journalisé.
    }
    logSecureExchangeError(correlationId, response.status, category);
    return { ok: false, status: response.status, message: `Rafraîchissement refusé par LinkedIn (${response.status}).`, category, correlationId };
  }

  const data = (await response.json()) as { access_token: string; expires_in: number; refresh_token?: string; scope?: string };
  return {
    ok: true,
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scopes: data.scope ? data.scope.split(",").map((scope) => scope.trim()) : LINKEDIN_MEMBER_SCOPES,
    },
  };
}

export type IdentityFetchResult = { ok: true; identity: LinkedInIdentity } | { ok: false; status: number; message: string };

/** Récupération minimale de l'identité autorisée (OpenID Connect `userinfo`) — jamais plus que le
 * nécessaire pour identifier le compte connecté et l'associer à la marque. */
export async function fetchLinkedInIdentity(accessToken: string): Promise<IdentityFetchResult> {
  let response: Response;
  try {
    response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch {
    return { ok: false, status: 0, message: "LinkedIn injoignable (réseau)." };
  }
  if (!response.ok) {
    return { ok: false, status: response.status, message: `Identité LinkedIn inaccessible (${response.status}).` };
  }
  const data = (await response.json()) as { sub: string; name?: string; email?: string; picture?: string };
  return {
    ok: true,
    identity: {
      externalAccountId: `urn:li:person:${data.sub}`,
      name: data.name ?? "Compte LinkedIn",
      email: data.email ?? null,
      profileUrl: null, // Non exposé par userinfo — jamais deviné.
    },
  };
}
