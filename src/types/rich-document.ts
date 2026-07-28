/**
 * Document riche sérialisable (format JSON de l'éditeur Tiptap/ProseMirror), stocké tel quel
 * pour rester compatible avec la sauvegarde locale et une future colonne jsonb Supabase — ce
 * type reste volontairement découplé de l'éditeur pour ne pas lier la couche de types à Tiptap.
 */
export interface RichDocument {
  type: string;
  content?: unknown[];
  [key: string]: unknown;
}
