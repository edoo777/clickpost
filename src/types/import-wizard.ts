import type { SyncEntityType } from "@/lib/sync/types";

export type ImportItemState =
  | "ready"
  | "importing"
  | "imported"
  | "skipped"
  | "duplicate"
  | "conflict"
  | "error"
  | "to_retry";

export type DuplicateAction = "ignore" | "import_as_new" | "associate_existing";

/** Une ligne du journal local d'import (F1.8) — stockée dans `clickpost-sync-queue`
 * (store additif `import_journal`), jamais dans les 11 tables de workspace elles-mêmes. */
export interface ImportJournalEntry {
  id: string;
  entityType: SyncEntityType;
  recordId: string;
  state: ImportItemState;
  duplicateAction?: DuplicateAction;
  errorMessage?: string;
  updatedAt: string;
}

export type DependencyStatus = "present" | "missing";

export interface ImportDependency {
  /** Nom du champ local porteur de la référence (ex. "brandId"). */
  field: string;
  refId: string;
  entityType: SyncEntityType;
  status: DependencyStatus;
  /** Requise = bloque l'import tant que non satisfaite ; sinon simple avertissement. */
  required: boolean;
}

export interface ImportCandidate {
  entityType: SyncEntityType;
  recordId: string;
  record: Record<string, unknown>;
  title: string;
  brandId?: string;
  brandName?: string;
  isDuplicateId: boolean;
  fingerprintDuplicateOf?: string;
  dependencies: ImportDependency[];
}

export interface ImportScanResult {
  candidates: ImportCandidate[];
  excludedSeedCount: Partial<Record<SyncEntityType, number>>;
  alreadySyncedCount: Partial<Record<SyncEntityType, number>>;
  remoteIdsByEntity: Partial<Record<SyncEntityType, Set<string>>>;
}

export interface ImportReportEntityCounts {
  imported: number;
  skipped: number;
  duplicate: number;
  conflict: number;
  error: number;
}

export interface ImportReport {
  generatedAt: string;
  imported: number;
  skipped: number;
  excludedDemo: number;
  associatedExisting: number;
  conflicts: number;
  errors: number;
  remainingLocalOnly: number;
  perEntity: Partial<Record<SyncEntityType, ImportReportEntityCounts>>;
}
