import type { SocialPlatform } from "@/types/dashboard";
import type { Publication } from "@/types/publication";

/**
 * Limites indicatives par plateforme — valeurs publiques connues au moment de l'écriture,
 * volontairement approximatives et non garanties exactes (chaque plateforme les fait évoluer
 * sans préavis). Objectif : repérer les cas manifestement invalides avant publication, jamais
 * remplacer la vérification officielle de chaque réseau.
 */
export interface PlatformConstraints {
  textMaxLength: number;
  hashtagsMax: number;
  mediaMax: number;
  requiresMedia: boolean;
  /** `undefined` = images et vidéos acceptées. */
  requiredMediaType?: "image" | "video";
}

export const PLATFORM_CONSTRAINTS: Record<SocialPlatform, PlatformConstraints> = {
  instagram: { textMaxLength: 2200, hashtagsMax: 30, mediaMax: 10, requiresMedia: true },
  facebook: { textMaxLength: 5000, hashtagsMax: 30, mediaMax: 10, requiresMedia: false },
  linkedin: { textMaxLength: 3000, hashtagsMax: 20, mediaMax: 9, requiresMedia: false },
  tiktok: { textMaxLength: 2200, hashtagsMax: 20, mediaMax: 1, requiresMedia: true, requiredMediaType: "video" },
  youtube: { textMaxLength: 5000, hashtagsMax: 15, mediaMax: 1, requiresMedia: true, requiredMediaType: "video" },
  x: { textMaxLength: 280, hashtagsMax: 10, mediaMax: 4, requiresMedia: false },
  threads: { textMaxLength: 500, hashtagsMax: 10, mediaMax: 10, requiresMedia: false },
  pinterest: { textMaxLength: 500, hashtagsMax: 20, mediaMax: 1, requiresMedia: true, requiredMediaType: "image" },
  other: { textMaxLength: 10000, hashtagsMax: 30, mediaMax: 10, requiresMedia: false },
};

export interface ConstraintViolation {
  field: "text" | "hashtags" | "media";
  message: string;
}

/** Ne vérifie que des faits objectifs sur le contenu déjà saisi — n'invente et ne devine jamais
 * de contrainte au-delà de ce tableau. */
export function validatePlatformConstraints(publication: Publication): ConstraintViolation[] {
  const limits = PLATFORM_CONSTRAINTS[publication.platform];
  const violations: ConstraintViolation[] = [];

  if (publication.text.length > limits.textMaxLength) {
    violations.push({
      field: "text",
      message: `Texte trop long pour ${publication.platform} (${publication.text.length}/${limits.textMaxLength} caractères).`,
    });
  }

  const hashtagCount = publication.hashtags.filter((tag) => tag.trim().length > 0).length;
  if (hashtagCount > limits.hashtagsMax) {
    violations.push({
      field: "hashtags",
      message: `Trop de hashtags pour ${publication.platform} (${hashtagCount}/${limits.hashtagsMax}).`,
    });
  }

  if (limits.requiresMedia && publication.media.length === 0) {
    violations.push({ field: "media", message: `${publication.platform} exige au moins un média.` });
  }
  if (publication.media.length > limits.mediaMax) {
    violations.push({
      field: "media",
      message: `Trop de médias pour ${publication.platform} (${publication.media.length}/${limits.mediaMax} max).`,
    });
  }
  if (limits.requiredMediaType) {
    const hasWrongType = publication.media.some((media) => media.type !== limits.requiredMediaType);
    if (hasWrongType) {
      violations.push({
        field: "media",
        message: `${publication.platform} n'accepte que des médias de type "${limits.requiredMediaType}".`,
      });
    }
  }

  return violations;
}
