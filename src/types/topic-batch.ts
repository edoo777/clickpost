import type { GenerationTone } from "@/lib/assisted-generation";
import type { ContentType } from "@/lib/content-types";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export type TopicBatchStatus = "draft" | "generated" | "partially_saved" | "completed" | "archived";

export type TopicVarietyLevel = "low" | "medium" | "high";

export interface TopicBatch {
  id: string;
  brandId: string;
  themeId: string;
  name: string;
  requestedCount: number;
  generatedCount: number;
  selectedCount: number;
  targetAudience?: string;
  objective?: string;
  platforms: SocialPlatform[];
  formats: ContentFormat[];
  instructions?: string;
  varietyLevel?: TopicVarietyLevel;
  status: TopicBatchStatus;
  createdAt: string;
  updatedAt: string;
  /** Répartition des types de contenu demandée pour ce bloc (thématique), ex. { advice: 10,
   * proof: 5 } — additif, absent pour les blocs créés avant cette fonctionnalité. */
  contentTypeDistribution?: Partial<Record<ContentType, number>>;
  /** Relie les blocs créés ensemble lors d'une génération multi-thématiques — absent pour un
   * bloc généré seul (comportement d'origine inchangé). */
  groupId?: string;
  /** Ton de marque demandé pour cette génération — additif, absent pour les blocs antérieurs. */
  tone?: GenerationTone;
  /** Origine des sujets de ce bloc — absent pour les blocs générés avant cette fonctionnalité
   * (générateur simulé uniquement à l'époque). */
  source?: "claude" | "simulated";
}

export interface Topic {
  id: string;
  batchId: string;
  label: string;
  selected: boolean;
  locked: boolean;
  duplicateOfId?: string;
  /** Idée déjà créée à partir de ce sujet — évite les doublons lors d'un nouveau clic sur « Développer ». */
  ideaId?: string;
  /** Type de contenu (angle éditorial) de ce sujet — jamais une thématique. Absent pour les
   * sujets générés avant cette fonctionnalité ou pour les sujets sans type de contenu défini. */
  contentType?: ContentType;
}
