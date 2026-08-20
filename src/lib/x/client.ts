/**
 * Client REST X — API v2 pour la création du tweet (`/2/tweets`), API v1.1 pour le téléversement
 * de média (`/1.1/media/upload.json`, aucun équivalent v2 n'existe à ce jour côté X pour cette
 * opération — documentation officielle uniquement :
 * https://docs.x.com/x-api/media/quickstart/media-upload-chunked). Authentification par jeton
 * OAuth 2.0 User Context (Bearer) sur les deux API, acceptée par X pour l'upload média depuis la
 * dépréciation progressive d'OAuth 1.0a pour les nouvelles intégrations.
 *
 * Limite honnête (voir docs/social-platform-setup.md) : le téléversement ci-dessous envoie le
 * fichier en un seul segment `APPEND` plutôt qu'un vrai découpage multi-segments — suffisant pour
 * une image ou une courte vidéo dans la limite du corps de requête accepté par X (jusqu'à 5 Mo
 * par segment) ; jamais utilisé pour un fichier plus volumineux (voir la vérification de taille
 * dans provider.ts) plutôt que d'échouer silencieusement à mi-parcours.
 */
const API_BASE = "https://api.x.com/2";
const UPLOAD_BASE = "https://upload.x.com/1.1/media/upload.json";
const MAX_SINGLE_CHUNK_BYTES = 5 * 1024 * 1024;

export interface XApiError {
  status: number;
  message: string;
  isPermissionError: boolean;
}

export type XApiResult<T> = { ok: true; data: T } | { ok: false; error: XApiError };

function isPermissionStatus(status: number): boolean {
  return status === 403;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; errors?: { message?: string }[]; error?: string };
    return body.detail ?? body.errors?.[0]?.message ?? body.error ?? response.statusText;
  } catch {
    return response.statusText || "Erreur X sans détail.";
  }
}

export interface CreateTweetInput {
  text: string;
  mediaIds?: string[];
}

export async function createTweet(accessToken: string, input: CreateTweetInput): Promise<XApiResult<{ tweetId: string }>> {
  const body: Record<string, unknown> = { text: input.text };
  if (input.mediaIds && input.mediaIds.length > 0) body.media = { media_ids: input.mediaIds };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/tweets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: { status: 0, message: "X injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const message = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status) } };
  }
  const data = (await response.json()) as { data?: { id: string } };
  if (!data.data?.id) return { ok: false, error: { status: response.status, message: "Réponse X sans identifiant de tweet.", isPermissionError: false } };
  return { ok: true, data: { tweetId: data.data.id } };
}

export interface UploadMediaInput {
  accessToken: string;
  bytes: ArrayBuffer;
  mimeType: string;
  mediaCategory: "tweet_image" | "tweet_video";
}

export async function uploadMedia(input: UploadMediaInput): Promise<XApiResult<{ mediaId: string }>> {
  if (input.bytes.byteLength > MAX_SINGLE_CHUNK_BYTES) {
    return {
      ok: false,
      error: { status: 0, message: "Fichier trop volumineux pour le téléversement en un seul segment (limite actuelle 5 Mo).", isPermissionError: false },
    };
  }

  const initBody = new URLSearchParams({
    command: "INIT",
    total_bytes: String(input.bytes.byteLength),
    media_type: input.mimeType,
    media_category: input.mediaCategory,
  });
  let initResponse: Response;
  try {
    initResponse = await fetch(UPLOAD_BASE, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}` }, body: initBody });
  } catch {
    return { ok: false, error: { status: 0, message: "X injoignable (réseau).", isPermissionError: false } };
  }
  if (!initResponse.ok) {
    return { ok: false, error: { status: initResponse.status, message: await parseError(initResponse), isPermissionError: isPermissionStatus(initResponse.status) } };
  }
  const initData = (await initResponse.json()) as { media_id_string?: string };
  const mediaId = initData.media_id_string;
  if (!mediaId) return { ok: false, error: { status: initResponse.status, message: "Réponse X sans identifiant de média (INIT).", isPermissionError: false } };

  const appendForm = new FormData();
  appendForm.set("command", "APPEND");
  appendForm.set("media_id", mediaId);
  appendForm.set("segment_index", "0");
  appendForm.set("media", new Blob([input.bytes], { type: input.mimeType }));
  let appendResponse: Response;
  try {
    appendResponse = await fetch(UPLOAD_BASE, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}` }, body: appendForm });
  } catch {
    return { ok: false, error: { status: 0, message: "X injoignable (réseau).", isPermissionError: false } };
  }
  if (!appendResponse.ok) {
    return {
      ok: false,
      error: { status: appendResponse.status, message: await parseError(appendResponse), isPermissionError: isPermissionStatus(appendResponse.status) },
    };
  }

  const finalizeBody = new URLSearchParams({ command: "FINALIZE", media_id: mediaId });
  let finalizeResponse: Response;
  try {
    finalizeResponse = await fetch(UPLOAD_BASE, { method: "POST", headers: { Authorization: `Bearer ${input.accessToken}` }, body: finalizeBody });
  } catch {
    return { ok: false, error: { status: 0, message: "X injoignable (réseau).", isPermissionError: false } };
  }
  if (!finalizeResponse.ok) {
    return {
      ok: false,
      error: { status: finalizeResponse.status, message: await parseError(finalizeResponse), isPermissionError: isPermissionStatus(finalizeResponse.status) },
    };
  }
  const finalizeData = (await finalizeResponse.json()) as { processing_info?: { state: string } };

  if (input.mediaCategory === "tweet_video" && finalizeData.processing_info) {
    const ready = await pollProcessingStatus(input.accessToken, mediaId);
    if (!ready.ok) return ready;
  }

  return { ok: true, data: { mediaId } };
}

async function pollProcessingStatus(accessToken: string, mediaId: string): Promise<XApiResult<true>> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const url = new URL(UPLOAD_BASE);
    url.searchParams.set("command", "STATUS");
    url.searchParams.set("media_id", mediaId);
    let response: Response;
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    } catch {
      return { ok: false, error: { status: 0, message: "X injoignable (réseau) pendant le traitement du média.", isPermissionError: false } };
    }
    if (!response.ok) {
      return { ok: false, error: { status: response.status, message: await parseError(response), isPermissionError: isPermissionStatus(response.status) } };
    }
    const data = (await response.json()) as { processing_info?: { state: string; error?: { message?: string } } };
    const state = data.processing_info?.state;
    if (!state || state === "succeeded") return { ok: true, data: true };
    if (state === "failed") {
      return { ok: false, error: { status: 0, message: data.processing_info?.error?.message ?? "Traitement du média X échoué.", isPermissionError: false } };
    }
  }
  return { ok: false, error: { status: 0, message: "Traitement du média X non confirmé dans le délai imparti.", isPermissionError: false } };
}
