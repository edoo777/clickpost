import { getLinkedInConfig } from "@/lib/linkedin/config";

/**
 * Client REST LinkedIn — API Posts actuelle (`/rest/posts`), jamais l'ancienne API `ugcPosts`
 * (dépréciée). En-têtes officiels systématiques : version LinkedIn (`LinkedIn-Version`,
 * configurable via `LINKEDIN_API_VERSION`, jamais codée en dur), protocole Rest.li 2.0
 * (`X-Restli-Protocol-Version`), jeton Bearer. Documentation officielle uniquement :
 * https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 */

const API_BASE = "https://api.linkedin.com/rest";

function headers(accessToken: string, extra?: Record<string, string>): HeadersInit {
  const config = getLinkedInConfig();
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": config?.apiVersion ?? "",
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

export interface LinkedInApiError {
  status: number;
  message: string;
  /** Vrai pour un refus de permission LinkedIn confirmé (403 avec un code lié aux portées) —
   * distinct d'une erreur générique, jamais deviné à partir du seul code HTTP. */
  isPermissionError: boolean;
}

function isPermissionStatus(status: number): boolean {
  return status === 403;
}

export type LinkedInApiResult<T> = { ok: true; data: T } | { ok: false; error: LinkedInApiError };

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText || "Erreur LinkedIn sans détail.";
  }
}

export interface CreateTextPostInput {
  authorUrn: string;
  text: string;
  /** URL unique optionnelle (partage texte + lien) — LinkedIn ne permet qu'un seul lien par
   * publication native, jamais plusieurs. */
  articleUrl?: string;
  mediaUrns?: string[];
}

/** Crée une publication texte, texte+URL, ou avec un ou plusieurs médias déjà téléversés
 * (`mediaUrns`, voir uploadImage). Ne jamais appeler avant d'avoir vérifié les contraintes de la
 * plateforme (voir platform-constraints.ts) côté appelant. */
export async function createPost(accessToken: string, input: CreateTextPostInput): Promise<LinkedInApiResult<{ postUrn: string }>> {
  const body: Record<string, unknown> = {
    author: input.authorUrn,
    commentary: input.text,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (input.mediaUrns && input.mediaUrns.length === 1) {
    body.content = { media: { id: input.mediaUrns[0] } };
  } else if (input.mediaUrns && input.mediaUrns.length > 1) {
    body.content = { multiImage: { images: input.mediaUrns.map((id) => ({ id })) } };
  } else if (input.articleUrl) {
    body.content = { article: { source: input.articleUrl } };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: headers(accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: { status: 0, message: "LinkedIn injoignable (réseau).", isPermissionError: false } };
  }

  if (response.status !== 201) {
    const message = await parseErrorBody(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status) } };
  }

  // LinkedIn renvoie l'identifiant du post dans l'en-tête `x-restli-id`, jamais dans le corps —
  // jamais inventé si l'en-tête est absent (échec explicite plutôt qu'un identifiant fictif).
  const postUrn = response.headers.get("x-restli-id");
  if (!postUrn) {
    return { ok: false, error: { status: response.status, message: "Réponse LinkedIn sans identifiant de publication.", isPermissionError: false } };
  }

  return { ok: true, data: { postUrn } };
}

export interface InitializeImageUploadResult {
  uploadUrl: string;
  imageUrn: string;
}

/** Étape 1/2 du téléversement d'image — voir uploadImage pour l'étape 2 (envoi des octets). */
export async function initializeImageUpload(accessToken: string, authorUrn: string): Promise<LinkedInApiResult<InitializeImageUploadResult>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/images?action=initializeUpload`, {
      method: "POST",
      headers: headers(accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
    });
  } catch {
    return { ok: false, error: { status: 0, message: "LinkedIn injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    const message = await parseErrorBody(response);
    return { ok: false, error: { status: response.status, message, isPermissionError: isPermissionStatus(response.status) } };
  }
  const data = (await response.json()) as { value: { uploadUrl: string; image: string } };
  return { ok: true, data: { uploadUrl: data.value.uploadUrl, imageUrn: data.value.image } };
}

/** Étape 2/2 : envoi des octets réels de l'image vers l'URL de téléversement à usage unique
 * obtenue à l'étape 1 — jamais réutilisée pour un second fichier, jamais traitée comme permanente
 * (voir la mise en garde du mandat sur les URLs signées). */
export async function uploadImageBytes(uploadUrl: string, fileBytes: ArrayBuffer, contentType: string): Promise<LinkedInApiResult<true>> {
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: fileBytes });
  } catch {
    return { ok: false, error: { status: 0, message: "Téléversement du média injoignable (réseau).", isPermissionError: false } };
  }
  if (!response.ok) {
    return { ok: false, error: { status: response.status, message: "Téléversement du média refusé par LinkedIn.", isPermissionError: isPermissionStatus(response.status) } };
  }
  return { ok: true, data: true };
}
