/**
 * TikTok Content Posting API — documentation officielle uniquement :
 * https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 * Vidéo uniquement (voir platform-constraints.ts : `requiredMediaType: "video"`, `mediaMax: 1`).
 */
const API_BASE = "https://open.tiktokapis.com/v2";

export interface TikTokApiError {
  status: number;
  message: string;
  isPermissionError: boolean;
}

export type TikTokApiResult<T> = { ok: true; data: T } | { ok: false; error: TikTokApiError };

function headers(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" };
}

function isPermissionStatus(status: number, code: string | undefined): boolean {
  return status === 403 || code === "access_token_invalid" || code === "scope_not_authorized" || code === "unaudited_client_can_not_post_to_public";
}

interface TikTokErrorBody {
  error?: { code?: string; message?: string; log_id?: string };
}

async function parseError(response: Response): Promise<{ message: string; code?: string }> {
  try {
    const body = (await response.json()) as TikTokErrorBody;
    return { message: body.error?.message ?? response.statusText, code: body.error?.code };
  } catch {
    return { message: response.statusText || "Erreur TikTok sans détail." };
  }
}

export interface CreatorInfo {
  nickname: string;
  privacyLevelOptions: string[];
  maxVideoDurationSec: number;
}

/** TikTok exige de récupérer les options de confidentialité disponibles pour le créateur avant
 * chaque publication (guideline officielle) — jamais une valeur de confidentialité devinée. */
export async function fetchCreatorInfo(accessToken: string): Promise<TikTokApiResult<CreatorInfo>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/post/publish/creator_info/query/`, { method: "POST", headers: headers(accessToken) });
  } catch {
    return { ok: false, error: { status: 0, message: "TikTok injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const { message, code } = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status, code) } };
  }
  const data = (await response.json()) as {
    data?: { creator_nickname?: string; privacy_level_options?: string[]; max_video_post_duration_sec?: number };
  };
  return {
    ok: true,
    data: {
      nickname: data.data?.creator_nickname ?? "",
      privacyLevelOptions: data.data?.privacy_level_options ?? [],
      maxVideoDurationSec: data.data?.max_video_post_duration_sec ?? 0,
    },
  };
}

export interface InitVideoPublishInput {
  videoUrl: string;
  title: string;
  privacyLevel: string;
}

/** Initialise une publication vidéo via récupération de l'URL par TikTok (`PULL_FROM_URL`) —
 * jamais un envoi direct d'octets pour ce mode. Une application non auditée par TikTok reçoit
 * malgré tout `publish_id` en retour, mais la vidéo n'est envoyée qu'à la boîte de réception
 * privée du créateur (`SELF_ONLY` forcé côté TikTok), jamais publiée publiquement — voir le
 * statut renvoyé par fetchPublishStatus pour confirmer l'état réel, jamais supposé. */
export async function initVideoPublish(accessToken: string, input: InitVideoPublishInput): Promise<TikTokApiResult<{ publishId: string }>> {
  const body = JSON.stringify({
    post_info: { title: input.title, privacy_level: input.privacyLevel, disable_duet: false, disable_comment: false, disable_stitch: false },
    source_info: { source: "PULL_FROM_URL", video_url: input.videoUrl },
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/post/publish/video/init/`, { method: "POST", headers: headers(accessToken), body });
  } catch {
    return { ok: false, error: { status: 0, message: "TikTok injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const { message, code } = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status, code) } };
  }
  const data = (await response.json()) as { data?: { publish_id?: string } };
  if (!data.data?.publish_id) {
    return { ok: false, error: { status: response.status, message: "Réponse TikTok sans identifiant de publication.", isPermissionError: false } };
  }
  return { ok: true, data: { publishId: data.data.publish_id } };
}

export interface PublishStatus {
  status: "PROCESSING_DOWNLOAD" | "PROCESSING_UPLOAD" | "SEND_TO_USER_INBOX" | "PUBLISH_COMPLETE" | "FAILED" | string;
  failReason: string | null;
  publiclyAvailablePostId: string | null;
}

export async function fetchPublishStatus(accessToken: string, publishId: string): Promise<TikTokApiResult<PublishStatus>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/post/publish/status/fetch/`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({ publish_id: publishId }),
    });
  } catch {
    return { ok: false, error: { status: 0, message: "TikTok injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const { message, code } = await parseError(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status, code) } };
  }
  const data = (await response.json()) as {
    data?: { status?: string; fail_reason?: string; publicaly_available_post_id?: number[]; publicly_available_post_id?: number[] };
  };
  const postIds = data.data?.publicly_available_post_id ?? data.data?.publicaly_available_post_id;
  return {
    ok: true,
    data: {
      status: data.data?.status ?? "FAILED",
      failReason: data.data?.fail_reason ?? null,
      publiclyAvailablePostId: postIds && postIds.length > 0 ? String(postIds[0]) : null,
    },
  };
}
