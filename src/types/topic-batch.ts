import type { GenerationTone } from "@/lib/assisted-generation";
import type { ContentType } from "@/lib/content-types";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export type TopicBatchStatus = "draft" | "generated" | "partially_saved" | "completed" | "archived";

export type TopicVarietyLevel = "low" | "medium" | "high";

export interface TopicBatch {
  id: string;
  brandId: string;
  /** Absent pour un bloc généré à partir d'une thématique ponctuelle jamais enregistrée dans les
   * paramètres de la marque (voir adhocThemeLabel) — le champ reste optionnel plutôt qu'une
   * chaîne vide, pour ne jamais laisser croire à une vraie thématique inexistante. */
  themeId?: string;
  /** Libellé de la thématique ponctuelle saisie pour cette génération — présent uniquement
   * lorsque themeId est absent. Jamais synchronisé vers la table themes tant que l'utilisateur
   * n'a pas explicitement confirmé « Ajouter cette thématique aux paramètres de la marque ». */
  adhocThemeLabel?: string;
  /** Niche saisie manuellement pour une génération ponctuelle sans marque (brandId vide) —
   * absent dès qu'une vraie marque est utilisée (la niche vient alors de brand.industry). */
  standaloneNiche?: string;
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
  /** Type de contenu (catégorie éditoriale : Conseil, Preuve, Offre…) de ce sujet — jamais une
   * thématique. Absent pour les sujets générés avant cette fonctionnalité ou sans type défini. */
  contentType?: ContentType;
  /** Angle recommandé pour traiter ce sujet (ex. « Pourquoi continuer à le faire soi-même coûte
   * plus cher ») — distinct du type de contenu (une catégorie) et de la thématique (un pilier
   * récurrent). Repris tel quel dans `Idea.angle` lors du développement du sujet. Absent pour les
   * sujets générés avant cette fonctionnalité ou en mode simulé. */
  angle?: string;
}
