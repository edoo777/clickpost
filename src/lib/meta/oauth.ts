import { getMetaConfig } from "@/lib/meta/config";
import { createOAuthState, verifyOAuthState, type OAuthStatePayload } from "@/lib/oauth/state-token";
import type { TokenExchangeResult } from "@/lib/social/connections";

/**
 * OAuth Meta (Facebook Login for Business) — partagé par Instagram et Facebook, voir
 * src/lib/meta/config.ts pour l'explication de cette mutualisation. Documentation officielle
 * uniquement : https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 *
 * Particularité Meta par rapport à LinkedIn/TikTok/X/YouTube : il n'existe PAS de jeton de
 * rafraîchissement séparé. Le jeton utilisateur "longue durée" (~60 jours) se renouvelle en se
 * ré-échangeant lui-même contre un nouveau jeton longue durée (`grant_type=fb_exchange_token`,
 * voir refreshUserToken ci-dessous) tant qu'il n'est pas encore expiré — jamais après expiration,
 * auquel cas une reconnexion complète est nécessaire, exactement comme LinkedIn sans jeton de
 * rafraîchissement. C'est pourquoi ce module stocke le jeton utilisateur longue durée dans le rôle
 * "refreshToken" de la connexion (voir src/lib/instagram/connections.ts et
 * src/lib/facebook/connections.ts) : il ne sert jamais directement à publier, uniquement à
 * dériver un jeton de Page à jour.
 */
function apiBase(apiVersion: string) {
  return `https://graph.facebook.com/${apiVersion}`;
}

function logSecureExchangeError(platform: string, correlationId: string, status: number, category: string) {
  console.error(`[meta-oauth:${platform}] échec — réf=${correlationId} statut=${status} catégorie=${category}`);
}

export function buildAuthorizationUrl(
  product: "instagram" | "facebook",
  payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">,
  scopes: string[]
): string {
  const config = getMetaConfig(product);
  if (!config) throw new Error(`Intégration Meta (${product}) non configurée.`);
  const state = createOAuthState(payload, config.clientSecret);
  const url = new URL(`https://www.facebook.com/${config.apiVersion}/dialog/oauth`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export type StateVerificationResult =
  | { valid: true; payload: OAuthStatePayload }
  | { valid: false; reason: "malformed" | "invalid_signature" | "expired" | "not_configured" };

export function verifyCallbackState(product: "instagram" | "facebook", state: string): StateVerificationResult {
  const config = getMetaConfig(product);
  if (!config) return { valid: false, reason: "not_configured" };
  return verifyOAuthState(state, config.clientSecret);
}

interface MetaTokenPayload {
  accessToken: string;
  expiresAt: string;
}

type TokenExchangeFailure = Extract<TokenExchangeResult, { ok: false }>;

async function exchangeToken(
  product: "instagram" | "facebook",
  params: Record<string, string>,
  correlationId: string
): Promise<{ ok: true; payload: MetaTokenPayload } | { ok: false; result: TokenExchangeFailure }> {
  const config = getMetaConfig(product);
  if (!config) {
    logSecureExchangeError(product, correlationId, 503, "not_configured");
    return {
      ok: false,
      result: { ok: false, status: 503, message: "Intégration Meta non configurée.", category: "not_configured", correlationId },
    };
  }

  const url = new URL(`${apiBase(config.apiVersion)}/oauth/access_token`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    logSecureExchangeError(product, correlationId, 0, "network_unreachable");
    return {
      ok: false,
      result: { ok: false, status: 0, message: "Meta injoignable (réseau).", category: "network_unreachable", correlationId },
    };
  }

  if (!response.ok) {
    let category = "meta_rejected";
    try {
      const parsed = (await response.json()) as { error?: { type?: string; code?: number } };
      if (parsed.error?.type) category = parsed.error.type;
    } catch {
      // Corps non-JSON — catégorie générique conservée, jamais le corps journalisé.
    }
    logSecureExchangeError(product, correlationId, response.status, category);
    return {
      ok: false,
      result: {
        ok: false,
        status: response.status,
        message: `Échange du jeton refusé par Meta (${response.status}).`,
        category,
        correlationId,
      },
    };
  }

  const data = (await response.json()) as { access_token: string; expires_in?: number };
  // Meta n'indique pas toujours `expires_in` pour un jeton court terme ; l'échange longue durée
  // qui suit systématiquement (voir exchangeCodeForToken) en fournit toujours un — un jeton sans
  // durée connue à ce stade intermédiaire n'est jamais utilisé directement pour publier.
  const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : new Date().toISOString();
  return { ok: true, payload: { accessToken: data.access_token, expiresAt } };
}

export type CodeExchangeResult =
  | { ok: true; longLivedUserToken: string; expiresAt: string }
  | { ok: false; status: number; message: string; category: string; correlationId: string };

/** Échange le code d'autorisation → jeton utilisateur court terme, puis échange immédiatement ce
 * jeton contre un jeton utilisateur longue durée (~60 jours) — jamais le jeton court terme stocké
 * ni utilisé pour publier, voir la documentation officielle Meta sur les jetons longue durée. */
export async function exchangeCodeForLongLivedUserToken(product: "instagram" | "facebook", code: string): Promise<CodeExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getMetaConfig(product);
  if (!config) {
    logSecureExchangeError(product, correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration Meta non configurée.", category: "not_configured", correlationId };
  }

  const shortLived = await exchangeToken(
    product,
    { client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, code },
    correlationId
  );
  if (!shortLived.ok) return shortLived.result;

  const longLived = await exchangeToken(
    product,
    {
      grant_type: "fb_exchange_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      fb_exchange_token: shortLived.payload.accessToken,
    },
    correlationId
  );
  if (!longLived.ok) return longLived.result;

  return { ok: true, longLivedUserToken: longLived.payload.accessToken, expiresAt: longLived.payload.expiresAt };
}

/** Renouvelle un jeton utilisateur longue durée déjà valide — jamais appelable sur un jeton déjà
 * expiré (Meta refuse l'échange dans ce cas, comme toute plateforme sans rafraîchissement
 * silencieux après expiration réelle). */
export async function refreshUserToken(product: "instagram" | "facebook", currentUserToken: string): Promise<CodeExchangeResult> {
  const correlationId = crypto.randomUUID();
  const config = getMetaConfig(product);
  if (!config) {
    logSecureExchangeError(product, correlationId, 503, "not_configured");
    return { ok: false, status: 503, message: "Intégration Meta non configurée.", category: "not_configured", correlationId };
  }
  const renewed = await exchangeToken(
    product,
    { grant_type: "fb_exchange_token", client_id: config.clientId, client_secret: config.clientSecret, fb_exchange_token: currentUserToken },
    correlationId
  );
  if (!renewed.ok) return renewed.result;
  return { ok: true, longLivedUserToken: renewed.payload.accessToken, expiresAt: renewed.payload.expiresAt };
}

export interface ManagedPage {
  pageId: string;
  pageName: string;
  /** Jeton de Page — durée de vie héritée du jeton utilisateur longue durée qui l'a produit,
   * jamais indéfiniment valide malgré l'absence d'expiration explicite renvoyée par Meta. */
  pageAccessToken: string;
  instagramBusinessAccountId: string | null;
  instagramUsername: string | null;
}

export type ManagedPagesResult = { ok: true; pages: ManagedPage[] } | { ok: false; status: number; message: string };

/** Liste les Pages Facebook administrées par l'utilisateur, avec le compte professionnel
 * Instagram lié à chacune si présent — un seul appel Graph API suffit pour les deux produits
 * (voir la mutualisation documentée dans meta/config.ts). */
export async function fetchManagedPages(product: "instagram" | "facebook", userAccessToken: string): Promise<ManagedPagesResult> {
  const config = getMetaConfig(product);
  if (!config) return { ok: false, status: 503, message: "Intégration Meta non configurée." };

  const url = new URL(`${apiBase(config.apiVersion)}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("access_token", userAccessToken);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    return { ok: false, status: 0, message: "Meta injoignable (réseau)." };
  }
  if (!response.ok) {
    return { ok: false, status: response.status, message: `Impossible de récupérer les Pages administrées (${response.status}).` };
  }

  const data = (await response.json()) as {
    data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[];
  };
  const pages = (data.data ?? []).map((page) => ({
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    instagramBusinessAccountId: page.instagram_business_account?.id ?? null,
    instagramUsername: page.instagram_business_account?.username ?? null,
  }));
  return { ok: true, pages };
}

/**
 * Rafraîchissement complet d'une connexion Page/Instagram : renouvelle le jeton utilisateur
 * longue durée stocké (voir refreshUserToken), puis re-dérive le jeton de la Page précise
 * (`pageId`) à partir de ce jeton renouvelé — c'est la seule façon d'obtenir un jeton de Page à
 * jour, Meta ne proposant aucun endpoint de rafraîchissement direct sur un jeton de Page dérivé.
 * Utilisé par `src/lib/instagram/connections.ts` et `src/lib/facebook/connections.ts` comme
 * `refreshFn` de `src/lib/social/connections.ts`.
 */
export async function refreshPageToken(product: "instagram" | "facebook", userToken: string, pageId: string): Promise<TokenExchangeResult> {
  const correlationId = crypto.randomUUID();
  const renewedUser = await refreshUserToken(product, userToken);
  if (!renewedUser.ok) return renewedUser;

  const pages = await fetchManagedPages(product, renewedUser.longLivedUserToken);
  if (!pages.ok) {
    return { ok: false, status: pages.status, message: pages.message, category: "pages_fetch_failed", correlationId };
  }
  const page = pages.pages.find((candidate) => candidate.pageId === pageId);
  if (!page) {
    return {
      ok: false,
      status: 404,
      message: "Page introuvable parmi les Pages administrées après rafraîchissement — accès probablement révoqué.",
      category: "page_not_found",
      correlationId,
    };
  }

  const permissions = await fetchGrantedPermissions(product, renewedUser.longLivedUserToken);
  const scopes = permissions.ok ? permissions.scopes : [];

  return {
    ok: true,
    token: {
      accessToken: page.pageAccessToken,
      refreshToken: renewedUser.longLivedUserToken,
      expiresAt: renewedUser.expiresAt,
      scopes,
    },
  };
}

export type PermissionsResult = { ok: true; scopes: string[] } | { ok: false; status: number; message: string };

/** Portées réellement accordées par l'utilisateur — Meta ne les renvoie pas dans la réponse
 * d'échange de jeton, contrairement à LinkedIn/TikTok/X : un appel dédié est nécessaire, jamais
 * une supposition à partir des portées demandées (l'utilisateur peut en refuser certaines dans la
 * boîte de dialogue Facebook Login). */
export async function fetchGrantedPermissions(product: "instagram" | "facebook", userAccessToken: string): Promise<PermissionsResult> {
  const config = getMetaConfig(product);
  if (!config) return { ok: false, status: 503, message: "Intégration Meta non configurée." };

  const url = new URL(`${apiBase(config.apiVersion)}/me/permissions`);
  url.searchParams.set("access_token", userAccessToken);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    return { ok: false, status: 0, message: "Meta injoignable (réseau)." };
  }
  if (!response.ok) return { ok: false, status: response.status, message: `Permissions Meta inaccessibles (${response.status}).` };

  const data = (await response.json()) as { data?: { permission: string; status: string }[] };
  const scopes = (data.data ?? []).filter((entry) => entry.status === "granted").map((entry) => entry.permission);
  return { ok: true, scopes };
}
