import { isValidSnapshot } from "@/lib/persistence/validate";
import type { PersistenceAdapter, WorkspaceSnapshot } from "@/lib/persistence/types";

const DB_NAME = "clickpost-workspace";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const CURRENT_KEY = "current";
const PREVIOUS_KEY = "previous";

export function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error("IndexedDB indisponible dans cet environnement."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ouverture d'IndexedDB impossible."));
  });
}

function getRecord(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error("Lecture IndexedDB impossible."));
  });
}

function putRecord(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Écriture IndexedDB impossible."));
  });
}

function clearStore(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Suppression IndexedDB impossible."));
  });
}

export const indexedDbAdapter: PersistenceAdapter = {
  async loadWorkspace() {
    const db = await openDatabase();
    const current = await getRecord(db, CURRENT_KEY);
    if (isValidSnapshot(current)) return current;
    // La sauvegarde courante est absente ou corrompue : repli sur la précédente sans jamais la supprimer.
    const previous = await getRecord(db, PREVIOUS_KEY);
    if (isValidSnapshot(previous)) return previous;
    return null;
  },
  async saveWorkspace(snapshot: WorkspaceSnapshot) {
    const db = await openDatabase();
    const existingCurrent = await getRecord(db, CURRENT_KEY);
    if (isValidSnapshot(existingCurrent)) {
      await putRecord(db, PREVIOUS_KEY, existingCurrent);
    }
    await putRecord(db, CURRENT_KEY, snapshot);
  },
  async clearWorkspace() {
    const db = await openDatabase();
    await clearStore(db);
  },
  async getLastSavedAt() {
    const db = await openDatabase();
    const current = await getRecord(db, CURRENT_KEY);
    return isValidSnapshot(current) ? current.savedAt : null;
  },
};
