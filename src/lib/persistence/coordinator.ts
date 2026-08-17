import { indexedDbAdapter, isIndexedDbAvailable } from "@/lib/persistence/indexeddb-adapter";
import {
  WORKSPACE_SCHEMA_VERSION,
  type WorkspaceData,
  type WorkspaceKey,
  type WorkspaceSnapshot,
} from "@/lib/persistence/types";
import { clearSyncQueue } from "@/lib/sync/queue";

const DEBOUNCE_MS = 800;
const SAFETY_INTERVAL_MS = 30_000;
const RETRY_DELAY_MS = 5_000;
const BROADCAST_CHANNEL_NAME = "clickpost-workspace";
const THEME_STORAGE_KEY = "clickpost-theme";
const SIDEBAR_STORAGE_KEY = "clickpost-sidebar-collapsed";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface SaveStatusState {
  status: SaveStatus;
  lastSavedAt: string | null;
  errorMessage: string | null;
  conflictNotice: boolean;
}

let statusState: SaveStatusState = {
  status: "idle",
  lastSavedAt: null,
  errorMessage: null,
  conflictNotice: false,
};

const statusListeners = new Set<() => void>();

function setStatus(patch: Partial<SaveStatusState>) {
  statusState = { ...statusState, ...patch };
  statusListeners.forEach((listener) => listener());
}

export function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function getStatusSnapshot(): SaveStatusState {
  return statusState;
}

export function getStatusServerSnapshot(): SaveStatusState {
  return { status: "idle", lastSavedAt: null, errorMessage: null, conflictNotice: false };
}

export function dismissConflictNotice() {
  setStatus({ conflictNotice: false });
}

// État partagé entre toutes les instances de usePersistedState : une seule minuterie,
// une seule écriture à la fois, jamais d'écritures concurrentes entre magasins.
const pendingData: Partial<WorkspaceData> = {};
let hasUnsavedChanges = false;
let isSaving = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function registerInitialValue<K extends WorkspaceKey>(key: K, value: WorkspaceData[K]) {
  pendingData[key] = value;
}

export function registerChange<K extends WorkspaceKey>(key: K, value: WorkspaceData[K]) {
  pendingData[key] = value;
  hasUnsavedChanges = true;
  setStatus({ status: "pending" });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void flushSave();
  }, DEBOUNCE_MS);
}

export function flushNow() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  void flushSave();
}

async function flushSave() {
  if (isSaving || !hasUnsavedChanges || !isIndexedDbAvailable()) return;
  isSaving = true;
  setStatus({ status: "saving" });
  const snapshot: WorkspaceSnapshot = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    data: { ...pendingData },
  };
  try {
    await indexedDbAdapter.saveWorkspace(snapshot);
    hasUnsavedChanges = false;
    setStatus({ status: "saved", lastSavedAt: snapshot.savedAt, errorMessage: null });
    broadcast({ type: "saved", id: snapshot.id, savedAt: snapshot.savedAt });
  } catch (error) {
    setStatus({ status: "error", errorMessage: error instanceof Error ? error.message : "Erreur inconnue." });
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void flushSave(), RETRY_DELAY_MS);
  } finally {
    isSaving = false;
  }
}

export function initializeSnapshotMeta(savedAt: string) {
  setStatus({ status: "saved", lastSavedAt: savedAt });
}

// Diffusion multi-onglets : purement informative (jamais de fusion/écrasement silencieux).
let channel: BroadcastChannel | null = null;

function broadcast(message: { type: "saved"; id: string; savedAt: string }) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  channel ??= new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  channel.postMessage(message);
}

function listenToOtherTabs() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  channel ??= new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  channel.onmessage = (event) => {
    const message = event.data as { type?: string; savedAt?: string };
    if (message?.type !== "saved") return;
    if (hasUnsavedChanges) {
      // Un autre onglet a sauvegardé pendant que celui-ci a des modifications locales non
      // enregistrées : on informe l'utilisateur, mais on ne touche ni à ses données en mémoire
      // ni à la sauvegarde de l'autre onglet (elle sera conservée comme version précédente lors
      // de la prochaine écriture de cet onglet, grâce à la rotation courante/précédente).
      setStatus({ conflictNotice: true });
    } else if (message.savedAt) {
      setStatus({ lastSavedAt: message.savedAt });
    }
  };
}

// Déclencheurs globaux (un seul enregistrement, jamais dupliqué par instance de composant).
let triggersInitialized = false;

export function ensureGlobalTriggers() {
  if (triggersInitialized || typeof window === "undefined") return;
  triggersInitialized = true;

  listenToOtherTabs();

  document.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const isFormField =
      target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
    if (isFormField && hasUnsavedChanges) flushNow();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && hasUnsavedChanges) flushNow();
  });

  window.addEventListener("pagehide", () => {
    if (hasUnsavedChanges) flushNow();
  });

  window.addEventListener("beforeunload", () => {
    if (hasUnsavedChanges) flushNow();
  });

  setInterval(() => {
    if (hasUnsavedChanges) flushNow();
  }, SAFETY_INTERVAL_MS);
}

// Export / import / effacement — utilisés par la section « Données et confidentialité ».
export interface ExportedBackup {
  schemaVersion: number;
  exportedAt: string;
  data: Partial<WorkspaceData>;
  preferences: { theme: string | null; sidebarCollapsed: string | null };
}

function isValidExportedBackup(value: unknown): value is ExportedBackup {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ExportedBackup>;
  if (typeof candidate.schemaVersion !== "number") return false;
  if (!candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data)) return false;
  return true;
}

export function buildExportBackup(): ExportedBackup {
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { ...pendingData },
    preferences: {
      theme: window.localStorage.getItem(THEME_STORAGE_KEY),
      sidebarCollapsed: window.localStorage.getItem(SIDEBAR_STORAGE_KEY),
    },
  };
}

export function downloadBackupFile(backup: ExportedBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clickpost-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportPreview {
  backup: ExportedBackup;
  counts: { label: string; count: number }[];
}

const IMPORT_COUNT_LABELS: Partial<Record<WorkspaceKey, string>> = {
  posts: "publications",
  accounts: "comptes sociaux",
  teamMembers: "membres d'équipe",
  themes: "thématiques",
  campaigns: "campagnes",
  topicBatches: "lots de sujets",
  topics: "sujets",
  ideas: "idées",
  contentVersions: "versions de contenu",
  workflowStages: "colonnes de workflow",
  savedViews: "vues enregistrées",
};

export async function readImportFile(file: File): Promise<ImportPreview> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  if (!isValidExportedBackup(parsed)) {
    throw new Error("Ce fichier ne correspond pas au format de sauvegarde ClickPost.");
  }
  const counts = Object.entries(IMPORT_COUNT_LABELS)
    .map(([key, label]) => {
      const value = parsed.data[key as WorkspaceKey];
      return { label: label as string, count: Array.isArray(value) ? value.length : 0 };
    })
    .filter((entry) => entry.count > 0);
  return { backup: parsed, counts };
}

export async function applyImportedBackup(backup: ExportedBackup): Promise<void> {
  if (isIndexedDbAvailable()) {
    const snapshot: WorkspaceSnapshot = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      data: backup.data,
    };
    // saveWorkspace() bascule automatiquement l'état courant précédent en sauvegarde
    // "previous" avant d'écrire l'import : rien n'est perdu même en cas d'erreur d'import.
    await indexedDbAdapter.saveWorkspace(snapshot);
  }
  if (backup.preferences.theme) window.localStorage.setItem(THEME_STORAGE_KEY, backup.preferences.theme);
  if (backup.preferences.sidebarCollapsed) {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, backup.preferences.sidebarCollapsed);
  }
}

export async function clearLocalData(): Promise<void> {
  if (isIndexedDbAvailable()) {
    await indexedDbAdapter.clearWorkspace();
    // Efface aussi la file de synchronisation (opérations en attente, états de révision, journal
    // d'import) — sinon des opérations encore en attente d'un utilisateur précédent pourraient
    // être poussées vers Supabase sous l'identité/le workspace de l'utilisateur suivant sur un
    // navigateur partagé (voir clearSyncQueue).
    await clearSyncQueue();
  }
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  window.localStorage.removeItem(SIDEBAR_STORAGE_KEY);
}
