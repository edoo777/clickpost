import type { SyncEntityType, SyncOperation, SyncStateEntry } from "@/lib/sync/types";

const DB_NAME = "clickpost-sync-queue";
const DB_VERSION = 1;
const OPERATIONS_STORE = "operations";
const SYNC_STATE_STORE = "sync_state";

function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error("IndexedDB indisponible."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        db.createObjectStore(OPERATIONS_STORE, { keyPath: "queueId", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SYNC_STATE_STORE)) {
        db.createObjectStore(SYNC_STATE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ouverture de la file de synchronisation impossible."));
  });
}

export async function enqueueOperation(op: Omit<SyncOperation, "queueId" | "attempts">): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    tx.objectStore(OPERATIONS_STORE).add({ ...op, attempts: 0 });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Ajout à la file impossible."));
  });
}

export async function getAllOperations(): Promise<SyncOperation[]> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readonly");
    const request = tx.objectStore(OPERATIONS_STORE).getAll();
    request.onsuccess = () => resolve((request.result as SyncOperation[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Lecture de la file impossible."));
  });
}

export async function removeOperation(queueId: number): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    tx.objectStore(OPERATIONS_STORE).delete(queueId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Suppression de l'opération impossible."));
  });
}

export async function updateOperation(queueId: number, patch: Partial<SyncOperation>): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    const store = tx.objectStore(OPERATIONS_STORE);
    const getRequest = store.get(queueId);
    getRequest.onsuccess = () => {
      const existing = getRequest.result as SyncOperation | undefined;
      if (existing) store.put({ ...existing, ...patch });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Mise à jour de l'opération impossible."));
  });
}

export async function countPendingOperations(): Promise<number> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readonly");
    const request = tx.objectStore(OPERATIONS_STORE).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Comptage de la file impossible."));
  });
}

export async function getSyncState(id: string): Promise<SyncStateEntry | null> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readonly");
    const request = tx.objectStore(SYNC_STATE_STORE).get(id);
    request.onsuccess = () => resolve((request.result as SyncStateEntry | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Lecture de l'état de synchronisation impossible."));
  });
}

export async function setSyncState(
  id: string,
  entityType: SyncEntityType,
  revision: number,
  syncedAt: string
): Promise<void> {
  const db = await openQueueDb();
  const entry: SyncStateEntry = { id, entityType, lastSyncedRevision: revision, lastSyncedAt: syncedAt, conflict: false };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readwrite");
    tx.objectStore(SYNC_STATE_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Écriture de l'état de synchronisation impossible."));
  });
}

export async function markConflict(
  id: string,
  entityType: SyncEntityType,
  remote: Record<string, unknown> | null
): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readwrite");
    const store = tx.objectStore(SYNC_STATE_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result as SyncStateEntry | undefined;
      const entry: SyncStateEntry = {
        id,
        entityType,
        lastSyncedRevision: existing?.lastSyncedRevision ?? 0,
        lastSyncedAt: existing?.lastSyncedAt ?? new Date().toISOString(),
        conflict: true,
        conflictRemote: remote,
      };
      store.put(entry);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Marquage du conflit impossible."));
  });
}

export async function countConflicts(): Promise<number> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readonly");
    const request = tx.objectStore(SYNC_STATE_STORE).getAll();
    request.onsuccess = () => {
      const entries = (request.result as SyncStateEntry[]) ?? [];
      resolve(entries.filter((entry) => entry.conflict).length);
    };
    request.onerror = () => reject(request.error ?? new Error("Comptage des conflits impossible."));
  });
}

/** Liste complète des conflits (F1.7) — `countConflicts` ne renvoyait jusqu'ici qu'un total. */
export async function getAllConflicts(): Promise<SyncStateEntry[]> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readonly");
    const request = tx.objectStore(SYNC_STATE_STORE).getAll();
    request.onsuccess = () => {
      const entries = (request.result as SyncStateEntry[]) ?? [];
      resolve(entries.filter((entry) => entry.conflict));
    };
    request.onerror = () => reject(request.error ?? new Error("Lecture des conflits impossible."));
  });
}

/**
 * Aligne `lastSyncedRevision` sur la révision distante vérifiée fraîche juste avant une
 * résolution (F1.7), sans jamais effacer le marqueur `conflict` ni la version distante
 * conservée — celui-ci n'est levé que par `setSyncState`, appelé uniquement après un succès
 * confirmé par Supabase (soit via le renvoi normal dans la file, soit en adoptant le distant).
 */
export async function primeRevisionForResolution(
  id: string,
  entityType: SyncEntityType,
  revision: number,
  syncedAt: string
): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readwrite");
    const store = tx.objectStore(SYNC_STATE_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result as SyncStateEntry | undefined;
      const entry: SyncStateEntry = {
        id,
        entityType,
        lastSyncedRevision: revision,
        lastSyncedAt: syncedAt,
        conflict: existing?.conflict ?? true,
        conflictRemote: existing?.conflictRemote,
      };
      store.put(entry);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Préparation de la résolution impossible."));
  });
}

export { isIndexedDbAvailable as isSyncQueueAvailable };
