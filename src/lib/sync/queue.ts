import type { SyncEntityType, SyncOperation, SyncStateEntry } from "@/lib/sync/types";
import type { ImportJournalEntry } from "@/types/import-wizard";

const DB_NAME = "clickpost-sync-queue";
// F1.8 — montée additive : un seul nouveau store (`import_journal`), aucun store existant
// modifié ou supprimé. Les bases déjà en version 1 sont migrées automatiquement par
// IndexedDB (onupgradeneeded), sans perte des opérations/états déjà présents.
const DB_VERSION = 2;
const OPERATIONS_STORE = "operations";
const SYNC_STATE_STORE = "sync_state";
const IMPORT_JOURNAL_STORE = "import_journal";

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
      if (!db.objectStoreNames.contains(IMPORT_JOURNAL_STORE)) {
        db.createObjectStore(IMPORT_JOURNAL_STORE, { keyPath: "id" });
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

/** Lecture groupée de tout `sync_state` (F1.8 — analyse d'import) : évite d'ouvrir une
 * connexion IndexedDB par enregistrement lors du balayage des 11 magasins locaux. */
export async function getAllSyncStates(): Promise<SyncStateEntry[]> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STATE_STORE, "readonly");
    const request = tx.objectStore(SYNC_STATE_STORE).getAll();
    request.onsuccess = () => resolve((request.result as SyncStateEntry[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Lecture des états de synchronisation impossible."));
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

// ---------------------------------------------------------------------------------------
// F1.8 — Journal local de la session d'importation des anciennes données IndexedDB. Store
// additif distinct de `sync_state` (qui ne trace que le succès final) : nécessaire pour
// suivre la progression pendant un lot encore en cours et permettre une reprise fidèle
// après interruption (fermeture d'onglet, perte réseau). Jamais vidé automatiquement en
// dehors d'une nouvelle analyse explicitement relancée par l'utilisateur.
// ---------------------------------------------------------------------------------------

export async function getImportJournal(): Promise<ImportJournalEntry[]> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMPORT_JOURNAL_STORE, "readonly");
    const request = tx.objectStore(IMPORT_JOURNAL_STORE).getAll();
    request.onsuccess = () => resolve((request.result as ImportJournalEntry[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Lecture du journal d'import impossible."));
  });
}

export async function putImportJournalEntry(entry: ImportJournalEntry): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMPORT_JOURNAL_STORE, "readwrite");
    tx.objectStore(IMPORT_JOURNAL_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Écriture du journal d'import impossible."));
  });
}

/** Repart d'une analyse neuve — n'efface que le journal d'import (jamais `sync_state`,
 * `operations`, ni aucune donnée de workspace). */
export async function clearImportJournal(): Promise<void> {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMPORT_JOURNAL_STORE, "readwrite");
    tx.objectStore(IMPORT_JOURNAL_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Réinitialisation du journal d'import impossible."));
  });
}

export { isIndexedDbAvailable as isSyncQueueAvailable };
