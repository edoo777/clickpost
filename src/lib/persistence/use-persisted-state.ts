"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useWorkspaceSnapshot } from "@/components/persistence/WorkspacePersistenceProvider";
import { registerChange, registerInitialValue } from "@/lib/persistence/coordinator";
import type { WorkspaceData, WorkspaceKey } from "@/lib/persistence/types";

/**
 * Remplacement direct de useState pour tout état de magasin devant survivre à un rafraîchissement.
 * Même signature de retour que useState : aucune logique métier des magasins n'est modifiée,
 * seule la source de la valeur initiale et la notification des changements changent.
 */
export function usePersistedState<K extends WorkspaceKey>(
  key: K,
  fallback: WorkspaceData[K]
): [WorkspaceData[K], Dispatch<SetStateAction<WorkspaceData[K]>>] {
  const { getInitialValue } = useWorkspaceSnapshot();
  const [state, setState] = useState<WorkspaceData[K]>(() => getInitialValue(key, fallback));
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      registerInitialValue(key, state);
      return;
    }
    registerChange(key, state);
  }, [key, state]);

  return [state, setState];
}
