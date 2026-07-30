"use client";

import { useEffect, useRef } from "react";
import type { WorkspaceData, WorkspaceKey } from "@/lib/persistence/types";
import { usePersistedState } from "@/lib/persistence/use-persisted-state";
import { isSyncableRecordId } from "@/lib/sync/is-user-created";
import { enqueueSyncOperation, registerSyncedEntity } from "@/lib/sync/runtime";
import type { SyncEntityType } from "@/lib/sync/types";

interface RecordWithId {
  id: string;
  [key: string]: unknown;
}

/**
 * Remplacement direct de `usePersistedState` pour les champs de magasin synchronisés avec
 * Supabase (Lots 1 à 3 de F1.4, F1.5, F1.6). Même comportement de persistance locale que
 * l'original (aucune régression) — ajoute la détection des créations/modifications/
 * suppressions par comparaison d'identifiants, mise en file pour synchronisation, ainsi que
 * l'enregistrement auprès du registre de fusion (F1.6) qui permet à un pull Supabase au
 * démarrage d'appliquer ses résultats directement à cet état déjà monté. Les enregistrements
 * de démonstration (registre explicite, voir seed-registry.ts) ne sont jamais mis en file —
 * une vraie donnée utilisateur n'est jamais exclue à cause de la seule forme de son identifiant.
 */
export function useSyncedPersistedState<K extends WorkspaceKey>(
  key: K,
  fallback: WorkspaceData[K],
  entityType: SyncEntityType
) {
  const [state, setState] = usePersistedState(key, fallback);
  const stateRef = useRef(state);
  const previousRef = useRef(state);
  const isFirstRun = useRef(true);
  // Une fusion (pull) vient d'être appliquée à cet état : la prochaine transition ne doit
  // jamais être ré-enfilée comme s'il s'agissait d'une modification locale (elle est déjà
  // marquée synchronisée côté file — voir `mergeEntityRows` dans runtime.ts).
  const isApplyingMergeRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      previousRef.current = state;
      return;
    }
    if (isApplyingMergeRef.current) {
      isApplyingMergeRef.current = false;
      previousRef.current = state;
      return;
    }
    diffAndEnqueue(entityType, previousRef.current as unknown as RecordWithId[], state as unknown as RecordWithId[]);
    previousRef.current = state;
  }, [state, entityType]);

  useEffect(() => {
    const unregister = registerSyncedEntity(entityType, {
      getRecords: () => stateRef.current as unknown as RecordWithId[],
      applyMerged: (merged) => {
        isApplyingMergeRef.current = true;
        setState(merged as unknown as WorkspaceData[K]);
      },
      applyLocalEdit: (records) => {
        setState(records as unknown as WorkspaceData[K]);
      },
    });
    return unregister;
  }, [entityType, setState]);

  return [state, setState] as const;
}

function diffAndEnqueue(entityType: SyncEntityType, previous: RecordWithId[], current: RecordWithId[]) {
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const currentById = new Map(current.map((item) => [item.id, item]));

  for (const [id, item] of currentById) {
    if (!isSyncableRecordId(id)) continue;
    const prior = previousById.get(id);
    if (!prior || prior !== item) {
      enqueueSyncOperation(entityType, "upsert", id, item);
    }
  }

  for (const [id] of previousById) {
    if (currentById.has(id)) continue;
    if (!isSyncableRecordId(id)) continue;
    enqueueSyncOperation(entityType, "delete", id);
  }
}
