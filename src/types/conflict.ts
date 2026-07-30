import type { SyncEntityType } from "@/lib/sync/types";

export type ConflictResolutionChoice = "keep_local" | "keep_remote" | "merged" | "defer";

/**
 * Vue enrichie d'un conflit de synchronisation (F1.7), construite à partir d'un
 * `SyncStateEntry` en conflit (voir `src/lib/sync/queue.ts`) et de la version locale
 * actuellement montée dans le magasin concerné.
 */
export interface ConflictEntry {
  id: string;
  entityType: SyncEntityType;
  /** Version locale actuelle (camelCase) — `null` si l'enregistrement n'existe plus localement. */
  local: Record<string, unknown> | null;
  /** Version distante (camelCase), telle que capturée au moment de la détection du conflit. */
  remote: Record<string, unknown>;
  /** Ligne brute Supabase (snake_case) correspondant à `remote` — nécessaire pour revérifier
   * la révision distante juste avant l'écriture de résolution. */
  remoteRow: Record<string, unknown>;
  lastSyncedRevision: number;
}

export interface ResolveConflictResult {
  error: string | null;
  /** Présent uniquement si la version distante a changé pendant la comparaison : la
   * résolution a été annulée, le panneau doit se rafraîchir avec cette nouvelle version. */
  staleRemote?: Record<string, unknown>;
}
