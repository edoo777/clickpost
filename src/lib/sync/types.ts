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
  | "savedTrends";

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
}

export interface SyncStateEntry {
  id: string;
  entityType: SyncEntityType;
  lastSyncedRevision: number;
  lastSyncedAt: string;
  conflict: boolean;
  conflictRemote?: Record<string, unknown> | null;
}

export type SyncStatus = "idle" | "pending" | "syncing" | "merging" | "synced" | "conflict" | "error";

export interface SyncStatusState {
  status: SyncStatus;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}
