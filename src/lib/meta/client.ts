import { getMetaConfig } from "@/lib/meta/config";

/**
 * Appels Graph API réels de publication — Pages Facebook et comptes professionnels Instagram.
 * Documentation officielle uniquement :
 * https://developers.facebook.com/docs/pages-api/posts
 * https://developers.facebook.com/docs/instagram-platform/content-publishing
 */

export interface MetaApiError {
  status: number;
  message: string;
  isPermissionError: boolean;
}

export type MetaApiResult<T> = { ok: true; data: T } | { ok: false; error: MetaApiError };

function isPermissionStatus(status: number, code: number | undefined): boolean {
  // Meta renvoie généralement 400/403 avec un code d'erreur OAuth dédié (10, 200, 294...) pour un
  // refus de permission — jamais deviné à partir du seul status HTTP générique.
  return status === 403 || code === 10 || code === 200 || code === 294;
}

async function parseError(response: Response): Promise<{ message: string; code?: number }> {
  try {
    const body = (await response.json()) as { error?: { message?: string; code?: number } };
    return { message: body.error?.message ?? response.statusText, code: body.error?.code };
  } catch {
    return { message: response.statusText || "Erreur Meta sans détail." };
  }
}

function apiBase(): string {
  // `getMetaConfig` a déjà été vérifié par l'appelant (isConfigured()) avant tout appel de ce
  // module — l'apiVersion utilisée ici doit rester cohérente avec celle utilisée pour l'OAuth.
  const config = getMetaConfig("facebook") ?? getMetaConfig("instagram");
  return `https://graph.facebook.com/${config?.apiVersion ?? "v21.0"}`;
}

export interface CreateFacebookPostInput {
  pageId: string;
  pageAccessToken: string;
  message: string;
  /** URL publique du média (voir src/lib/social/media.ts, `getSignedPublicationMediaUrl`). */
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export async function createFacebookPost(input: CreateFacebookPostInput): Promise<MetaApiResult<{ postId: string }>> {
  const endpoint = input.mediaType === "video" ? "videos" : input.mediaType === "image" ? "photos" : "feed";
  const body = new URLSearchParams({ access_token: input.pageAccessToken });
  if (input.mediaType === "video") {
    body.set("description", input.message);
    if (input.mediaUrl) body.set("file_url", input.mediaUrl);
  } else if (input.mediaType === "image") {
    body.set("caption", input.message);
    if (input.mediaUrl) body.set("url", input.mediaUrl);
  } else {
    body.set("message", input.message);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/${input.pageId}/${endpoint}`, { method: "POST", body });
  } catch {
    return { ok: false, error: { status: 0, message: "Meta injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const { message, code } = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status, code) } };
  }
  const data = (await response.json()) as { id?: string; post_id?: string };
  const postId = data.post_id ?? data.id;
  if (!postId) return { ok: false, error: { status: response.status, message: "Réponse Meta sans identifiant de publication.", isPermissionError: false } };
  return { ok: true, data: { postId } };
}

export interface CreateInstagramMediaInput {
  igUserId: string;
  pageAccessToken: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "video";
}

/** Étape 1/2 de la publication Instagram : crée le conteneur média — Instagram récupère lui-même
 * les octets depuis `mediaUrl` (URL signée temporaire, voir src/lib/social/media.ts), jamais un
 * envoi direct d'octets comme LinkedIn. */
export async function createInstagramMediaContainer(input: CreateInstagramMediaInput): Promise<MetaApiResult<{ creationId: string }>> {
  const body = new URLSearchParams({ access_token: input.pageAccessToken, caption: input.caption });
  if (input.mediaType === "video") {
    body.set("media_type", "REELS");
    body.set("video_url", input.mediaUrl);
  } else {
    body.set("image_url", input.mediaUrl);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/${input.igUserId}/media`, { method: "POST", body });
  } catch {
    return { ok: false, error: { status: 0, message: "Meta injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const { message, code } = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status, code) } };
  }
  const data = (await response.json()) as { id?: string };
  if (!data.id) return { ok: false, error: { status: response.status, message: "Réponse Meta sans identifiant de conteneur média.", isPermissionError: false } };
  return { ok: true, data: { creationId: data.id } };
}

/** Étape 2/2 : publie le conteneur préparé. Pour une vidéo (REELS), Instagram traite le fichier
 * en arrière-plan après l'étape 1 — un `media_publish` appelé trop tôt échoue avec un code
 * `9007`/"Media ID is not available" ; l'appelant (provider.ts) patiente avec un ré-essai borné
 * plutôt que d'échouer immédiatement, jamais une boucle infinie. */
export async function publishInstagramMedia(igUserId: string, pageAccessToken: string, creationId: string): Promise<MetaApiResult<{ mediaId: string }>> {
  const body = new URLSearchParams({ access_token: pageAccessToken, creation_id: creationId });
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/${igUserId}/media_publish`, { method: "POST", body });
  } catch {
    return { ok: false, error: { status: 0, message: "Meta injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const { message, code } = await parseError(response);
    return {
      ok: false,
      error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status, code) },
    };
  }
  const data = (await response.json()) as { id?: string };
  if (!data.id) return { ok: false, error: { status: response.status, message: "Réponse Meta sans identifiant de média publié.", isPermissionError: false } };
  return { ok: true, data: { mediaId: data.id } };
}
