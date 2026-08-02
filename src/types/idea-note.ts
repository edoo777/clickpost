import type { ContentType } from "@/lib/content-types";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { IdeaStatus } from "@/types/idea";
import type { ContentPriority } from "@/types/publication";
import type { RichDocument } from "@/types/rich-document";

export type IdeaNoteArchiveStatus = "active" | "archived";

/**
 * Espace de rédaction libre de type Notion — modèle indépendant de Idea (voir docs de session :
 * Option B retenue). Une note n'apparaît jamais dans les vues Cartes/Tableau/Kanban (qui restent
 * lues depuis `ideas`, inchangées) ; elle n'existe qu'ici, jusqu'à conversion explicite.
 */
export interface IdeaNote {
  id: string;
  brandId?: string;
  /** Niche saisie manuellement — cohérent avec le mode ponctuel du Générateur d'idées. */
  standaloneNiche?: string;
  themeId?: string;
  adhocThemeLabel?: string;
  title: string;
  /** Document Tiptap/ProseMirror sérialisé — jamais du HTML libre. */
  content: RichDocument;
  /** Miroir texte brut du contenu — recherche, aperçu de liste, contexte envoyé à l'IA. */
  bodyText: string;
  contentType?: ContentType;
  format?: ContentFormat;
  objective?: string;
  platform?: SocialPlatform;
  /** Métadonnée descriptive facultative — ne pilote pas le cycle de vie de la note (voir archiveStatus). */
  status?: IdeaStatus;
  priority?: ContentPriority;
  owner?: string;
  /** Id de l'idée déjà créée à partir de cette note — empêche les doublons lors d'un nouveau clic
   * sur « Convertir en idée » ou « Développer dans la production ». */
  convertedIdeaId?: string;
  archiveStatus: IdeaNoteArchiveStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
