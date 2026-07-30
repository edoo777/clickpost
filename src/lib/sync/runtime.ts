import { mapRecordToRow, mapRowToRecord } from "@/lib/sync/mappers";
import * as queueDb from "@/lib/sync/queue";
import { isSyncableRecordId } from "@/lib/sync/is-user-created";
import { SYNC_TABLE_BY_ENTITY, type SyncEntityType, type SyncOperationKind, type SyncStatusState } from "@/lib/sync/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BROADCAST_CHANNEL_NAME = "clickpost-sync";

let statusState: SyncStatusState = {
  status: "idle",
  pendingCount: 0,
  conflictCount: 0,
  lastSyncedAt: null,
  errorMessage: null,
};

const listeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatusState>) {
  statusState = { ...statusState, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeSyncStatus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncStatusSnapshot(): SyncStatusState {
  return statusState;
}

export function getSyncStatusServerSnapshot(): SyncStatusState {
  return { status: "idle", pendingCount: 0, conflictCount: 0, lastSyncedAt: null, errorMessage: null };
}

// Contexte courant (workspace actif + utilisateur) — jamais de synchronisation sans les deux.
let currentWorkspaceId: string | null = null;
let currentUserId: string | null = null;

export function configureSyncContext(workspaceId: string | null, userId: string | null) {
  currentWorkspaceId = workspaceId;
  currentUserId = userId;
  if (workspaceId && userId) {
    void processSyncQueue();
    void pullAndMerge();
  }
}

let broadcastChannel: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  broadcastChannel ??= new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  return broadcastChannel;
}

/** Ajoute une opération à la file locale et déclenche une tentative de synchronisation. */
export function enqueueSyncOperation(
  entityType: SyncEntityType,
  operation: SyncOperationKind,
  recordId: string,
  payload?: Record<string, unknown>
) {
  void queueDb
    .enqueueOperation({ entityType, operation, recordId, payload, enqueuedAt: new Date().toISOString() })
    .then(async () => {
      const pendingCount = await queueDb.countPendingOperations();
      setStatus({ status: "pending", pendingCount });
      getBroadcastChannel()?.postMessage({ type: "sync-changed" });
      void processSyncQueue();
    });
}

let isProcessing = false;

/** Vide la file locale vers Supabase. Aucune donnée locale n'est jamais supprimée ici :
 * un échec laisse l'opération en file pour une nouvelle tentative ultérieure. */
export async function processSyncQueue() {
  if (isProcessing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (!currentWorkspaceId || !currentUserId) return;
  if (!queueDb.isSyncQueueAvailable()) return;

  isProcessing = true;
  try {
    const operations = await queueDb.getAllOperations();
    if (operations.length === 0) {
      const conflictCount = await queueDb.countConflicts();
      setStatus({ status: conflictCount > 0 ? "conflict" : "synced", pendingCount: 0, conflictCount });
      return;
    }

    setStatus({ status: "syncing", pendingCount: operations.length });
    const supabase = createSupabaseBrowserClient();
    let hadError = false;

    for (const op of operations) {
      try {
        await processOperation(supabase, op);
      } catch (error) {
        hadError = true;
        if (op.queueId !== undefined) {
          await queueDb.updateOperation(op.queueId, {
            attempts: op.attempts + 1,
            lastError: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const remaining = await queueDb.countPendingOperations();
    const conflictCount = await queueDb.countConflicts();
    setStatus({
      status: conflictCount > 0 ? "conflict" : remaining > 0 ? (hadError ? "error" : "syncing") : "synced",
      pendingCount: remaining,
      conflictCount,
      lastSyncedAt: remaining === 0 ? new Date().toISOString() : statusState.lastSyncedAt,
    });
  } finally {
    isProcessing = false;
  }
}

async function processOperation(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  op: Awaited<ReturnType<typeof queueDb.getAllOperations>>[number]
) {
  const table = SYNC_TABLE_BY_ENTITY[op.entityType];
  const syncState = await queueDb.getSyncState(op.recordId);

  if (op.operation === "delete") {
    if (!syncState) {
      // Jamais synchronisé côté distant : rien à supprimer là-bas.
      if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
      return;
    }
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", op.recordId)
      .eq("revision", syncState.lastSyncedRevision)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      await recordConflict(supabase, op.recordId, op.entityType, table);
      if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
      return;
    }
    await queueDb.setSyncState(op.recordId, op.entityType, data.revision as number, data.updated_at as string);
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }

  if (!op.payload) {
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }
  const row = mapRecordToRow(op.payload);

  if (!syncState) {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...row, workspace_id: currentWorkspaceId, created_by: currentUserId })
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === "23505") {
        // Déjà créé distant (nouvelle tentative après un précédent succès non confirmé
        // localement) : on considère la révision 1 connue et on continuera en update ensuite.
        await queueDb.setSyncState(op.recordId, op.entityType, 1, new Date().toISOString());
      } else {
        throw error;
      }
    } else if (data) {
      await queueDb.setSyncState(op.recordId, op.entityType, data.revision as number, data.updated_at as string);
    }
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }

  const { data, error } = await supabase
    .from(table)
    .update(row)
    .eq("id", op.recordId)
    .eq("revision", syncState.lastSyncedRevision)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await recordConflict(supabase, op.recordId, op.entityType, table);
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }
  await queueDb.setSyncState(op.recordId, op.entityType, data.revision as number, data.updated_at as string);
  if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
}

async function recordConflict(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  recordId: string,
  entityType: SyncEntityType,
  table: string
) {
  const { data: remote } = await supabase.from(table).select("*").eq("id", recordId).maybeSingle();
  await queueDb.markConflict(recordId, entityType, remote ?? null);
}

let triggersInitialized = false;

/** Déclencheurs globaux : reprise à la reconnexion, au retour d'onglet visible, et sur
 * notification d'un autre onglet — jamais dupliqués (un seul enregistrement process-wide). */
export function ensureSyncTriggers() {
  if (triggersInitialized || typeof window === "undefined") return;
  triggersInitialized = true;

  window.addEventListener("online", () => void processSyncQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void processSyncQueue();
  });

  const channel = getBroadcastChannel();
  if (channel) {
    channel.onmessage = (event) => {
      const message = event.data as { type?: string };
      if (message?.type === "sync-changed") void processSyncQueue();
    };
  }
}

// ---------------------------------------------------------------------------------------
// F1.6 — Pull et fusion au démarrage (moitié manquante du moteur : jusqu'ici, uniquement
// local → Supabase). Un pull unique par session, dès que le contexte est configuré ; les
// enregistrements distants sont fusionnés dans l'état React déjà monté des magasins via un
// registre de bindings (voir `registerSyncedEntity`, utilisé par `use-synced-state.ts`),
// jamais via une nouvelle lecture IndexedDB qui laisserait l'UI déjà affichée obsolète.
// ---------------------------------------------------------------------------------------

interface RecordWithId {
  id: string;
  [key: string]: unknown;
}

interface SyncedEntityBinding {
  getRecords: () => RecordWithId[];
  applyMerged: (merged: RecordWithId[]) => void;
}

const entityBindings = new Map<SyncEntityType, SyncedEntityBinding>();
// Lignes distantes reçues avant que le magasin correspondant ne soit monté (l'ordre de montage
// entre WorkspaceSessionProvider et les magasins synchronisés n'est pas garanti) — appliquées
// dès l'enregistrement tardif du binding, jamais perdues.
const bufferedRemoteRows = new Map<SyncEntityType, Record<string, unknown>[]>();

/** Appelé par `useSyncedPersistedState` à chaque montage/démontage d'un magasin synchronisé. */
export function registerSyncedEntity(entityType: SyncEntityType, binding: SyncedEntityBinding): () => void {
  entityBindings.set(entityType, binding);
  const buffered = bufferedRemoteRows.get(entityType);
  if (buffered) {
    bufferedRemoteRows.delete(entityType);
    void mergeEntityRows(entityType, buffered, binding);
  }
  return () => {
    if (entityBindings.get(entityType) === binding) entityBindings.delete(entityType);
  };
}

let hasPulledThisSession = false;

/** Pull unique par session : une requête par entité, filtrée sur le workspace actif. */
export async function pullAndMerge() {
  if (hasPulledThisSession) return;
  if (!currentWorkspaceId || !currentUserId) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  hasPulledThisSession = true;

  setStatus({ status: "merging" });
  const supabase = createSupabaseBrowserClient();

  try {
    for (const [entityType, table] of Object.entries(SYNC_TABLE_BY_ENTITY) as [SyncEntityType, string][]) {
      const { data, error } = await supabase.from(table).select("*").eq("workspace_id", currentWorkspaceId);
      if (error || !data) continue;

      const binding = entityBindings.get(entityType);
      if (binding) {
        await mergeEntityRows(entityType, data, binding);
      } else {
        bufferedRemoteRows.set(entityType, data);
      }
    }
    const conflictCount = await queueDb.countConflicts();
    setStatus({
      status: conflictCount > 0 ? "conflict" : "synced",
      conflictCount,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch {
    // Échec réseau/partiel : on retentera au prochain appel de configureSyncContext
    // (ex. reconnexion) plutôt que de laisser la session sans aucune donnée distante.
    hasPulledThisSession = false;
  }
}

/**
 * Fusionne des lignes distantes dans l'état local déjà monté d'une entité : jamais
 * d'écrasement d'un enregistrement dont une modification locale est encore dans la file
 * d'attente (l'envoi en cours reste prioritaire), dernier `updated_at` gagnant sinon,
 * suppression locale des enregistrements marqués `deleted_at` côté distant.
 */
async function mergeEntityRows(
  entityType: SyncEntityType,
  remoteRows: Record<string, unknown>[],
  binding: SyncedEntityBinding
): Promise<void> {
  const pendingOperations = await queueDb.getAllOperations();
  const pendingIds = new Set(
    pendingOperations.filter((op) => op.entityType === entityType).map((op) => op.recordId)
  );

  const local = binding.getRecords();
  const result = [...local];
  let changed = false;
  const newlySyncedRows: Record<string, unknown>[] = [];

  for (const row of remoteRows) {
    const id = row.id as string;
    if (!isSyncableRecordId(id)) continue; // jamais une donnée de démonstration.
    if (pendingIds.has(id)) continue; // une modification locale est encore en attente d'envoi.

    const index = result.findIndex((record) => record.id === id);
    const isRemoteDeleted = Boolean(row.deleted_at);

    if (isRemoteDeleted) {
      if (index !== -1) {
        result.splice(index, 1);
        changed = true;
      }
      continue;
    }

    const remoteUpdatedAt = row.updated_at as string | undefined;
    if (index === -1) {
      result.push(mapRowToRecord(row) as RecordWithId);
      changed = true;
      newlySyncedRows.push(row);
      continue;
    }

    const localUpdatedAt = (result[index] as { updatedAt?: string }).updatedAt;
    const remoteIsNewer =
      !localUpdatedAt || (remoteUpdatedAt !== undefined && new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime());
    if (remoteIsNewer) {
      result[index] = mapRowToRecord(row) as RecordWithId;
      changed = true;
      newlySyncedRows.push(row);
    }
  }

  if (!changed) return;

  binding.applyMerged(result);

  // Ces lignes viennent d'être reçues depuis Supabase : marquer leur révision comme déjà
  // synchronisée pour que `useSyncedPersistedState` ne les ré-enfile jamais comme un push.
  for (const row of newlySyncedRows) {
    await queueDb.setSyncState(row.id as string, entityType, row.revision as number, row.updated_at as string);
  }
}
