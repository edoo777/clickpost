"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { mapRowToRecord } from "@/lib/sync/mappers";
import * as queueDb from "@/lib/sync/queue";
import { resolveConflict } from "@/lib/sync/conflict-resolution";
import { getCurrentWorkspaceId, getLocalRecordById, subscribeConflicts } from "@/lib/sync/runtime";
import type { ConflictEntry, ConflictResolutionChoice, ResolveConflictResult } from "@/types/conflict";

interface ConflictsSessionValue {
  conflicts: ConflictEntry[];
  isLoading: boolean;
  refresh: () => void;
  resolve: (
    entry: ConflictEntry,
    choice: ConflictResolutionChoice,
    mergedRecord?: Record<string, unknown>
  ) => Promise<ResolveConflictResult>;
}

const ConflictsSessionContext = createContext<ConflictsSessionValue | null>(null);

/**
 * Centre des conflits (F1.7) : lit les entrées `sync_state` marquées en conflit (moteur F1.4,
 * détection inchangée), filtrées sur le workspace actif, associées à la version locale
 * actuellement montée dans le magasin concerné. Ne persiste rien de nouveau — dérivé de l'état
 * déjà existant du moteur de synchronisation.
 */
export function ConflictsSessionProvider({ children }: { children: ReactNode }) {
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const entries = await queueDb.getAllConflicts();
    const workspaceId = getCurrentWorkspaceId();
    const built: ConflictEntry[] = [];
    for (const entry of entries) {
      if (!entry.conflictRemote) continue;
      if (workspaceId && entry.conflictRemote.workspace_id !== workspaceId) continue;
      built.push({
        id: entry.id,
        entityType: entry.entityType,
        local: getLocalRecordById(entry.entityType, entry.id) ?? null,
        remote: mapRowToRecord(entry.conflictRemote),
        remoteRow: entry.conflictRemote,
        lastSyncedRevision: entry.lastSyncedRevision,
      });
    }
    setConflicts(built);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Appel différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect) :
    // `load` met à jour de l'état local, mais uniquement après ses propres `await`.
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => subscribeConflicts(() => void load()), [load]);

  async function resolve(
    entry: ConflictEntry,
    choice: ConflictResolutionChoice,
    mergedRecord?: Record<string, unknown>
  ): Promise<ResolveConflictResult> {
    const result = await resolveConflict(entry, choice, mergedRecord);
    await load();
    return result;
  }

  const value: ConflictsSessionValue = {
    conflicts,
    isLoading,
    refresh: () => void load(),
    resolve,
  };

  return <ConflictsSessionContext.Provider value={value}>{children}</ConflictsSessionContext.Provider>;
}

export function useConflictsSession() {
  const context = useContext(ConflictsSessionContext);
  if (!context) {
    throw new Error("useConflictsSession must be used within a ConflictsSessionProvider");
  }
  return context;
}
