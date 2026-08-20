import { createLocalStore } from "@/lib/local-storage-store";
import { DEFAULT_TABLE_COLUMNS } from "@/components/publications/view/publications-view-storage";

/**
 * Préférences du tableau Publications qui doivent survivre à la fermeture du navigateur (pas
 * seulement de l'onglet, contrairement au reste de `publications-view-storage.ts` qui reste en
 * `sessionStorage` à dessein) : ordre/largeur/visibilité des colonnes, couleur légère
 * d'en-tête. Stockage localStorage — persistant par appareil/profil navigateur, donc "au moins
 * par utilisateur" tel que demandé. Distinct des Vues enregistrées (`SavedView`, synchronisées
 * Supabase par workspace) : une vue nommée reste le mécanisme à privilégier pour une
 * configuration vraiment partagée entre appareils — ceci ne couvre que la configuration "par
 * défaut", jamais explicitement enregistrée par l'utilisateur.
 */
export interface PublicationsTablePreferences {
  visibleProperties: string[];
  columnWidths: Record<string, number>;
  /** Couleur légère optionnelle d'en-tête, par clé de colonne — jamais synchronisée avec
   * Supabase (préférence purement cosmétique locale). */
  columnColors: Record<string, string>;
}

export const DEFAULT_TABLE_PREFERENCES: PublicationsTablePreferences = {
  visibleProperties: DEFAULT_TABLE_COLUMNS,
  columnWidths: {},
  columnColors: {},
};

const store = createLocalStore("clickpost-publications-table-preferences", DEFAULT_TABLE_PREFERENCES);

export const subscribeTablePreferences = store.subscribe;
export const getTablePreferencesSnapshot = store.getSnapshot;
export const getTablePreferencesServerSnapshot = store.getServerSnapshot;
export const patchTablePreferences = store.patch;
export const resetTablePreferences = store.reset;
