/**
 * Validation pure des médias de publication — partagée par MediaUploader.tsx (client) et
 * réutilisable côté serveur si besoin futur. Le vrai rempart serveur reste la configuration du
 * bucket Supabase Storage (file_size_limit + allowed_mime_types, voir la migration associée) :
 * cette validation côté application est un filtre rapide, pas la seule ligne de défense.
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 Mo
export const MAX_MEDIA_COUNT = 8;

export type MediaValidation = { valid: true; kind: "image" | "video" } | { valid: false; message: string };

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Nom de fichier sûr pour un chemin de stockage : retire les caractères de contrôle, remplace
 * les séparateurs de chemin et tout caractère non alphanumérique par un tiret bas. L'extension
 * réelle est déterminée séparément (voir validateMediaFile), jamais depuis ce nom nettoyé seul. */
export function sanitizeFileName(name: string): string {
  const withoutControlChars = name.replace(/[\x00-\x1f\x7f]/g, "");
  const withoutSeparators = withoutControlChars.replace(/[/\\]/g, "_");
  const safe = withoutSeparators.replace(/[^\w.-]/g, "_");
  const trimmed = safe.slice(-150).trim();
  return trimmed.length > 0 ? trimmed : "fichier";
}

/**
 * Valide un fichier avant téléversement : type MIME réel (jamais seulement l'extension),
 * cohérence extension/MIME, taille selon le type, fichier vide, et le nombre maximal de médias
 * déjà atteint. Ne valide jamais uniquement l'extension déclarée (un fichier renommé en .jpg
 * mais dont le type réel n'est pas une image est rejeté).
 */
export function validateMediaFile(file: File, currentCount: number): MediaValidation {
  if (currentCount >= MAX_MEDIA_COUNT) {
    return { valid: false, message: `Maximum ${MAX_MEDIA_COUNT} médias par publication.` };
  }
  if (file.size === 0) {
    return { valid: false, message: "Ce fichier est vide." };
  }

  const isImageType = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideoType = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImageType && !isVideoType) {
    return { valid: false, message: "Format non pris en charge (JPG, PNG, WEBP, MP4, MOV ou WEBM)." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedExtensions = isImageType ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_VIDEO_EXTENSIONS;
  if (!expectedExtensions.includes(extension)) {
    return { valid: false, message: "L'extension du fichier ne correspond pas à son type réel." };
  }

  const kind = isImageType ? "image" : "video";
  const maxSize = isImageType ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  if (file.size > maxSize) {
    return { valid: false, message: `Fichier trop volumineux — maximum ${formatBytes(maxSize)} pour ${kind === "image" ? "une image" : "une vidéo"}.` };
  }

  return { valid: true, kind };
}
