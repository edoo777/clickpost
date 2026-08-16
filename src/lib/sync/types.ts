export type SyncEntityType =
  | "accounts"
  | "brands"
  | "campaigns"
  | "themes"
  | "topicBatches"
  | "topics"
  | "ideas"
  | "ideaNotes"
  | "contentVersions"
  | "workflowStages"
  | "savedViews"
  | "posts"
  | "importantDates"
  | "savedTrends"
  | "reports";

export const SYNC_TABLE_BY_ENTITY: Record<SyncEntityType, string> = {
  accounts: "accounts",
  brands: "brands",
  campaigns: "campaigns",
  themes: "themes",
  topicBatches: "topic_batches",
  topics: "topics",
  ideas: "ideas",
  ideaNotes: "idea_notes",
  contentVersions: "content_versions",
  workflowStages: "workflow_stages",
  savedViews: "saved_views",
  posts: "publications",
  importantDates: "important_dates",
  savedTrends: "saved_trends",
  reports: "reports",
};

export type SyncOperationKind = "upsert" | "delete";

export interface SyncOperation {
  queueId?: number;
  entityType: SyncEntityType;
  operation: SyncOperationKind;
  recordId: string;
  payload?: Record<string, unknown>;
  enqueuedAt: string;
  attempts: number;
  lastError?: string;
  /** Vrai si le dernier échec a été classifié comme définitif (RLS, contrainte, colonne/table
   * absente...) plutôt que transitoire (réseau, délai, verrou) — voir classify-sync-error.ts.
   * Informatif uniquement : l'opération reste en file et reste rejouable manuellement, ce
   * indicateur ne fait que refléter honnêtement la nature du dernier échec observé. */
  permanent?: boolean;
  /** Vrai dès qu'un échec définitif est confirmé — l'opération n'est alors plus rejouée
   * automatiquement (déclencheurs réseau/visibilité/onglet) tant qu'un utilisateur ne clique pas
   * explicitement sur « Réessayer » (qui débloque toutes les opérations bloquées avant de
   * retenter). Évite la boucle infinie et le bruit de journalisation d'une opération dont la
   * cause ne peut pas changer entre deux tentatives identiques. Jamais supprimée pour autant :
   * les données locales restent intactes et rejouables. */
  blocked?: boolean;
  /** Raison exploitable de la mise en blocage — copie de `lastError` au moment du blocage,
   * conservée séparément pour ne pas être écrasée par un état plus tard. */
  blockReason?: string;
}

export interface SyncStateEntry {
  id: string;
  entityType: SyncEntityType;
  lastSyncedRevision: number;
  lastSyncedAt: string;
  conflict: boolean;
  conflictRemote?: Record<string, unknown> | null;
}

export type SyncStatus = "idle" | "pending" | "syncing" | "merging" | "synced" | "conflict" | "error" | "offline";

export interface SyncStatusState {
  status: SyncStatus;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  /** Distingue "erreur persistante" (au moins un échec définitif observé lors de la dernière
   * tentative) de "erreur temporaire" (uniquement des échecs réseau/transitoires) — status reste
   * "error" dans les deux cas pour ne rien casser des vérifications existantes ; ce champ affine
   * uniquement l'affichage. Toujours remis à `false` dès qu'une tentative réussit intégralement. */
  isPersistentError: boolean;
  /** Au moins une opération en file a échoué avec un refus de permission confirmé (RLS,
   * code Postgres 42501) — catégorie d'affichage distincte de "erreur persistante" générique. */
  hasPermissionError: boolean;
  /** Au moins une opération est bloquée (échec définitif confirmé, retrait de la reprise
   * automatique) — catégorie d'affichage "Données locales à réparer", distincte d'une simple
   * erreur persistante encore activement rejouée. */
  hasBlockedOperations: boolean;
}
