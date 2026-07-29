export type SyncEntityType =
  | "accounts"
  | "brands"
  | "campaigns"
  | "themes"
  | "topicBatches"
  | "topics"
  | "ideas"
  | "contentVersions"
  | "workflowStages"
  | "savedViews"
  | "posts";

export const SYNC_TABLE_BY_ENTITY: Record<SyncEntityType, string> = {
  accounts: "accounts",
  brands: "brands",
  campaigns: "campaigns",
  themes: "themes",
  topicBatches: "topic_batches",
  topics: "topics",
  ideas: "ideas",
  contentVersions: "content_versions",
  workflowStages: "workflow_stages",
  savedViews: "saved_views",
  posts: "publications",
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

export type SyncStatus = "idle" | "pending" | "syncing" | "synced" | "conflict" | "error";

export interface SyncStatusState {
  status: SyncStatus;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}
