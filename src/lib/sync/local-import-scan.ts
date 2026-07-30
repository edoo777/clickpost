import { getRecordBrandRef, getRecordTitle } from "@/lib/conflict-display";
import { mapRowToRecord } from "@/lib/sync/mappers";
import * as queueDb from "@/lib/sync/queue";
import { getAllLocalRecords, getCurrentWorkspaceId } from "@/lib/sync/runtime";
import { isSeedRecordId } from "@/lib/sync/seed-registry";
import { SYNC_TABLE_BY_ENTITY, type SyncEntityType } from "@/lib/sync/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ImportCandidate, ImportDependency, ImportScanResult } from "@/types/import-wizard";

interface RecordWithId {
  id: string;
  [key: string]: unknown;
}

interface DependencyRule {
  field: string;
  entityType: SyncEntityType;
  required: boolean;
}

/**
 * Graphe de dépendances des 11 entités synchronisées (F1.8) — dérivé des types TypeScript
 * existants (`Idea.brandId`, `ContentVersion.ideaId`, etc.), jamais d'un nouveau schéma.
 * `required: true` bloque l'import de l'enfant tant que le parent n'est ni distant ni
 * sélectionné dans la même session ; `required: false` n'est qu'un avertissement informatif.
 */
const DEPENDENCY_RULES: Partial<Record<SyncEntityType, DependencyRule[]>> = {
  campaigns: [{ field: "brandId", entityType: "brands", required: true }],
  themes: [{ field: "brandId", entityType: "brands", required: true }],
  topicBatches: [
    { field: "brandId", entityType: "brands", required: true },
    { field: "themeId", entityType: "themes", required: true },
  ],
  topics: [{ field: "batchId", entityType: "topicBatches", required: true }],
  ideas: [
    { field: "brandId", entityType: "brands", required: true },
    { field: "themeId", entityType: "themes", required: false },
    { field: "batchId", entityType: "topicBatches", required: false },
    { field: "campaignId", entityType: "campaigns", required: false },
    { field: "workflowStageId", entityType: "workflowStages", required: false },
  ],
  contentVersions: [{ field: "ideaId", entityType: "ideas", required: true }],
  workflowStages: [{ field: "brandId", entityType: "brands", required: false }],
  savedViews: [{ field: "brandId", entityType: "brands", required: false }],
  posts: [
    { field: "accountId", entityType: "accounts", required: true },
    { field: "campaignId", entityType: "campaigns", required: false },
    { field: "ideaId", entityType: "ideas", required: false },
  ],
};

const ALL_ENTITY_TYPES = Object.keys(SYNC_TABLE_BY_ENTITY) as SyncEntityType[];

/**
 * Analyse locale (F1.8, étape 1) : classe chaque enregistrement des 11 magasins synchronisés
 * en démonstration / déjà synchronisé / candidat, détecte les doublons potentiels (id puis
 * fingerprint par titre) et les dépendances manquantes — lecture seule, aucune écriture.
 */
export async function scanLocalDataForImport(): Promise<ImportScanResult> {
  const workspaceId = getCurrentWorkspaceId();
  const supabase = createSupabaseBrowserClient();

  const remoteIdsByEntity: Partial<Record<SyncEntityType, Set<string>>> = {};
  const remoteTitleIndexByEntity = new Map<SyncEntityType, Map<string, string>>();

  if (workspaceId) {
    for (const entityType of ALL_ENTITY_TYPES) {
      const table = SYNC_TABLE_BY_ENTITY[entityType];
      const { data } = await supabase.from(table).select("*").eq("workspace_id", workspaceId);
      const rows = data ?? [];
      remoteIdsByEntity[entityType] = new Set(rows.map((row) => row.id as string));
      const titleIndex = new Map<string, string>();
      for (const row of rows) {
        const title = getRecordTitle(entityType, mapRowToRecord(row));
        if (title !== "Sans titre") titleIndex.set(title.trim().toLowerCase(), row.id as string);
      }
      remoteTitleIndexByEntity.set(entityType, titleIndex);
    }
  }

  const syncStates = await queueDb.getAllSyncStates();
  const syncedIds = new Set(syncStates.map((entry) => entry.id));
  const pendingOps = await queueDb.getAllOperations();

  const excludedSeedCount: Partial<Record<SyncEntityType, number>> = {};
  const alreadySyncedCount: Partial<Record<SyncEntityType, number>> = {};
  const candidates: ImportCandidate[] = [];

  for (const entityType of ALL_ENTITY_TYPES) {
    const localRecords = getAllLocalRecords(entityType) as RecordWithId[];
    const pendingIdsForEntity = new Set(
      pendingOps.filter((op) => op.entityType === entityType).map((op) => op.recordId)
    );
    const remoteIds = remoteIdsByEntity[entityType] ?? new Set<string>();
    const remoteTitleIndex = remoteTitleIndexByEntity.get(entityType) ?? new Map<string, string>();

    let seedCount = 0;
    let syncedCount = 0;

    for (const record of localRecords) {
      if (isSeedRecordId(record.id)) {
        seedCount += 1;
        continue;
      }
      if (syncedIds.has(record.id)) {
        syncedCount += 1;
        continue;
      }
      if (pendingIdsForEntity.has(record.id)) continue; // déjà en file normale : hors périmètre de l'import.

      const isDuplicateId = remoteIds.has(record.id);
      const title = getRecordTitle(entityType, record);
      const fingerprintDuplicateOf =
        !isDuplicateId && title !== "Sans titre" ? remoteTitleIndex.get(title.trim().toLowerCase()) : undefined;
      const { brandId, brandName } = getRecordBrandRef(record);

      const dependencies: ImportDependency[] = (DEPENDENCY_RULES[entityType] ?? [])
        .map((rule): ImportDependency | null => {
          const refId = record[rule.field];
          if (typeof refId !== "string" || !refId) return null;
          const refRemoteIds = remoteIdsByEntity[rule.entityType] ?? new Set<string>();
          return {
            field: rule.field,
            refId,
            entityType: rule.entityType,
            required: rule.required,
            status: refRemoteIds.has(refId) ? "present" : "missing",
          };
        })
        .filter((dep): dep is ImportDependency => dep !== null);

      candidates.push({
        entityType,
        recordId: record.id,
        record,
        title,
        brandId,
        brandName,
        isDuplicateId,
        fingerprintDuplicateOf,
        dependencies,
      });
    }

    if (seedCount > 0) excludedSeedCount[entityType] = seedCount;
    if (syncedCount > 0) alreadySyncedCount[entityType] = syncedCount;
  }

  return { candidates, excludedSeedCount, alreadySyncedCount, remoteIdsByEntity };
}
