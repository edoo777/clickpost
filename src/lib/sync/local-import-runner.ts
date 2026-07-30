import * as queueDb from "@/lib/sync/queue";
import { enqueueSyncOperation, getCurrentWorkspaceId } from "@/lib/sync/runtime";
import { SYNC_TABLE_BY_ENTITY, type SyncEntityType } from "@/lib/sync/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  DuplicateAction,
  ImportCandidate,
  ImportItemState,
  ImportJournalEntry,
} from "@/types/import-wizard";

/** Ordre des 3 lots imposé par les dépendances (F1.8) — un enfant n'est jamais mis en file
 * avant que son parent obligatoire ne soit distant ou déjà importé dans la même exécution. */
export const IMPORT_LOTS: SyncEntityType[][] = [
  ["brands", "accounts", "campaigns"],
  ["themes", "topicBatches", "topics", "ideas", "contentVersions", "workflowStages", "savedViews"],
  ["posts"],
];

const BATCH_SIZE = 10;
const SETTLEMENT_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 400;

export function journalKey(entityType: SyncEntityType, recordId: string): string {
  return `${entityType}:${recordId}`;
}

async function writeJournal(
  entityType: SyncEntityType,
  recordId: string,
  state: ImportItemState,
  extra?: { duplicateAction?: DuplicateAction; errorMessage?: string }
): Promise<ImportJournalEntry> {
  const entry: ImportJournalEntry = {
    id: journalKey(entityType, recordId),
    entityType,
    recordId,
    state,
    duplicateAction: extra?.duplicateAction,
    errorMessage: extra?.errorMessage,
    updatedAt: new Date().toISOString(),
  };
  await queueDb.putImportJournalEntry(entry);
  return entry;
}

/**
 * Attend qu'une opération enfilée normalement (F1.4) se règle — jamais un second moteur,
 * seulement une observation de la file existante. Hors ligne ou en erreur prolongée,
 * l'élément reste "pending" (traduit en `to_retry`) plutôt que faussement "importé".
 */
async function waitForSettlement(
  entityType: SyncEntityType,
  recordId: string
): Promise<"imported" | "conflict" | "error" | "pending"> {
  const start = Date.now();
  while (Date.now() - start < SETTLEMENT_TIMEOUT_MS) {
    const ops = await queueDb.getAllOperations();
    const stillQueued = ops.some((op) => op.entityType === entityType && op.recordId === recordId);
    if (!stillQueued) {
      const conflicts = await queueDb.getAllConflicts();
      if (conflicts.some((entry) => entry.entityType === entityType && entry.id === recordId)) return "conflict";
      const state = await queueDb.getSyncState(recordId);
      return state ? "imported" : "error";
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return "pending";
}

export interface RunImportOptions {
  candidates: ImportCandidate[];
  selectedKeys: Set<string>;
  duplicateActions: Map<string, DuplicateAction>;
  /** Marque choisie par l'utilisateur quand `brandId` local est absent/invalide (clé = journalKey). */
  brandOverrides: Map<string, string>;
  remoteIdsByEntity: Partial<Record<SyncEntityType, Set<string>>>;
  onProgress?: (entry: ImportJournalEntry) => void;
}

/**
 * Exécute l'import sélectionné en respectant l'ordre des 3 lots, par petits lots de 10,
 * en réutilisant exclusivement `enqueueSyncOperation`/la file de synchronisation existante
 * (F1.4) — aucun appel Supabase direct pour l'écriture elle-même. Idempotent : un élément
 * déjà `sync_state` ou déjà `imported` au journal n'est jamais retraité, ce qui permet une
 * reprise sûre après interruption (relance simplement `runImport` avec la même sélection).
 */
export async function runImport(options: RunImportOptions): Promise<void> {
  const { candidates, selectedKeys, duplicateActions, brandOverrides, remoteIdsByEntity, onProgress } = options;
  const workspaceId = getCurrentWorkspaceId();
  if (!workspaceId) return; // jamais d'écriture sans workspace actif vérifié.

  const supabase = createSupabaseBrowserClient();
  const importedThisRun = new Set<string>();

  function isRefSatisfied(entityType: SyncEntityType, refId: string): boolean {
    if ((remoteIdsByEntity[entityType] ?? new Set()).has(refId)) return true;
    return importedThisRun.has(journalKey(entityType, refId));
  }

  for (const lot of IMPORT_LOTS) {
    for (const entityType of lot) {
      const items = candidates.filter(
        (candidate) => candidate.entityType === entityType && selectedKeys.has(journalKey(candidate.entityType, candidate.recordId))
      );

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        for (const candidate of batch) {
          const key = journalKey(candidate.entityType, candidate.recordId);

          // Idempotence : déjà synchronisé (par cet import ou par le moteur normal en parallèle).
          const existingSyncState = await queueDb.getSyncState(candidate.recordId);
          if (existingSyncState) {
            importedThisRun.add(key);
            onProgress?.(await writeJournal(candidate.entityType, candidate.recordId, "imported"));
            continue;
          }

          const brandOverride = brandOverrides.get(key);
          const missingRequired = candidate.dependencies.find((dep) => {
            if (!dep.required) return false;
            if (dep.entityType === "brands" && brandOverride) return false;
            return !isRefSatisfied(dep.entityType, dep.refId);
          });
          if (missingRequired) {
            onProgress?.(
              await writeJournal(candidate.entityType, candidate.recordId, "to_retry", {
                errorMessage: `Dépendance manquante : ${missingRequired.field}`,
              })
            );
            continue;
          }

          const duplicateAction = duplicateActions.get(key);
          const isPotentialDuplicate = candidate.isDuplicateId || Boolean(candidate.fingerprintDuplicateOf);

          if (isPotentialDuplicate && duplicateAction !== "import_as_new") {
            if (duplicateAction === "associate_existing") {
              const targetId = candidate.isDuplicateId ? candidate.recordId : candidate.fingerprintDuplicateOf;
              if (targetId) {
                const table = SYNC_TABLE_BY_ENTITY[candidate.entityType];
                const { data } = await supabase.from(table).select("*").eq("id", targetId).maybeSingle();
                if (data) {
                  await queueDb.setSyncState(
                    candidate.recordId,
                    candidate.entityType,
                    data.revision as number,
                    data.updated_at as string
                  );
                }
              }
              importedThisRun.add(key);
              onProgress?.(
                await writeJournal(candidate.entityType, candidate.recordId, "duplicate", {
                  duplicateAction: "associate_existing",
                })
              );
              continue;
            }
            if (duplicateAction === "ignore" || (!duplicateAction && candidate.isDuplicateId)) {
              onProgress?.(
                await writeJournal(candidate.entityType, candidate.recordId, "skipped", {
                  duplicateAction: duplicateAction ?? "ignore",
                })
              );
              continue;
            }
            // Fingerprint sans action explicite : conserver les deux versions par défaut
            // (jamais destructif) — on continue vers l'import normal ci-dessous.
          }

          onProgress?.(await writeJournal(candidate.entityType, candidate.recordId, "importing"));
          const payload = brandOverride ? { ...candidate.record, brandId: brandOverride } : candidate.record;
          enqueueSyncOperation(candidate.entityType, "upsert", candidate.recordId, payload);
          const outcome = await waitForSettlement(candidate.entityType, candidate.recordId);
          if (outcome === "imported") importedThisRun.add(key);
          onProgress?.(
            await writeJournal(candidate.entityType, candidate.recordId, outcome === "pending" ? "to_retry" : outcome)
          );
        }
      }
    }
  }
}
