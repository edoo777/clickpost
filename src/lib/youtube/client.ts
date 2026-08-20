/**
 * YouTube Data API v3 — téléversement résumable (`uploadType=resumable`), documentation
 * officielle uniquement : https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
 * Vidéo uniquement (voir platform-constraints.ts : `requiredMediaType: "video"`, `mediaMax: 1`).
 */
const UPLOAD_INIT_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

export interface YouTubeApiError {
  status: number;
  message: string;
  isPermissionError: boolean;
}

export type YouTubeApiResult<T> = { ok: true; data: T } | { ok: false; error: YouTubeApiError };

function isPermissionStatus(status: number): boolean {
  return status === 403;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? response.statusText;
  } catch {
    return response.statusText || "Erreur YouTube sans détail.";
  }
}

export interface UploadVideoInput {
  accessToken: string;
  title: string;
  description: string;
  /** `private` par défaut recommandé pour toute intégration nouvellement branchée — jamais
   * `public` codé en dur ici : la valeur vient de l'appelant (provider.ts), qui doit rester
   * explicite sur ce choix plutôt que de le masquer dans ce client bas niveau. */
  privacyStatus: "private" | "unlisted" | "public";
  bytes: ArrayBuffer;
  mimeType: string;
}

/** Étape 1/2 : ouvre une session de téléversement résumable — renvoie l'URL de session unique
 * (en-tête `Location`), jamais réutilisée pour un second fichier. */
async function initiateResumableSession(input: UploadVideoInput): Promise<YouTubeApiResult<{ sessionUrl: string }>> {
  const body = JSON.stringify({ snippet: { title: input.title, description: input.description }, status: { privacyStatus: input.privacyStatus } });

  let response: Response;
  try {
    response = await fetch(UPLOAD_INIT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": input.mimeType,
        "X-Upload-Content-Length": String(input.bytes.byteLength),
      },
      body,
    });
  } catch {
    return { ok: false, error: { status: 0, message: "YouTube injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const message = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status) } };
  }
  const sessionUrl = response.headers.get("Location");
  if (!sessionUrl) {
    return { ok: false, error: { status: response.status, message: "Réponse YouTube sans URL de session de téléversement.", isPermissionError: false } };
  }
  return { ok: true, data: { sessionUrl } };
}

/** Étape 2/2 : envoi des octets réels vers la session ouverte à l'étape 1 — un seul envoi complet
 * (pas de découpage en plusieurs requêtes PUT) : suffisant pour toute vidéo déjà entièrement
 * chargée en mémoire par l'appelant (voir src/lib/social/media.ts, downloadPublicationMedia),
 * jamais utilisé pour un fichier dépassant les limites mémoire raisonnables d'une fonction
 * serveur — cette vérification reste à la charge de l'appelant (provider.ts). */
export async function uploadVideo(input: UploadVideoInput): Promise<YouTubeApiResult<{ videoId: string }>> {
  const session = await initiateResumableSession(input);
  if (!session.ok) return session;

  let response: Response;
  try {
    response = await fetch(session.data.sessionUrl, {
      method: "PUT",
      headers: { "Content-Type": input.mimeType, "Content-Length": String(input.bytes.byteLength) },
      body: input.bytes,
    });
  } catch {
    return { ok: false, error: { status: 0, message: "YouTube injoignable (réseau) pendant l'envoi de la vidéo.", isPermissionError: false } };
  }
  if (!response.ok) {
    const message = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status) } };
  }
  const data = (await response.json()) as { id?: string };
  if (!data.id) return { ok: false, error: { status: response.status, message: "Réponse YouTube sans identifiant de vidéo.", isPermissionError: false } };
  return { ok: true, data: { videoId: data.id } };
}
