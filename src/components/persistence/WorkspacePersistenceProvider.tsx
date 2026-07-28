"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingScreen } from "@/components/persistence/LoadingScreen";
import { indexedDbAdapter, isIndexedDbAvailable } from "@/lib/persistence/indexeddb-adapter";
import { ensureGlobalTriggers, initializeSnapshotMeta } from "@/lib/persistence/coordinator";
import type { WorkspaceData, WorkspaceKey } from "@/lib/persistence/types";

interface WorkspaceSnapshotContextValue {
  getInitialValue: <K extends WorkspaceKey>(key: K, fallback: WorkspaceData[K]) => WorkspaceData[K];
}

const WorkspaceSnapshotContext = createContext<WorkspaceSnapshotContextValue | null>(null);

export function useWorkspaceSnapshot() {
  const context = useContext(WorkspaceSnapshotContext);
  if (!context) {
    throw new Error("useWorkspaceSnapshot must be used within a WorkspacePersistenceProvider");
  }
  return context;
}

/**
 * Porte de chargement : lit la sauvegarde locale (IndexedDB) avant de rendre le reste de
 * l'application, afin qu'aucun magasin ne s'initialise avec les données de démonstration puis
 * ne les remplace après coup (pas de flash, pas d'écrasement d'une sauvegarde existante).
 * Le premier rendu serveur et le premier rendu client affichent tous deux l'état de chargement
 * (IndexedDB est asynchrone et inaccessible côté serveur) : la bascule vers le contenu réel se
 * fait uniquement après hydratation, ce qui reste compatible avec Next.js.
 */
export function WorkspacePersistenceProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const initialDataRef = useRef<Partial<WorkspaceData>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      ensureGlobalTriggers();
      if (!isIndexedDbAvailable()) {
        if (!cancelled) setIsReady(true);
        return;
      }
      try {
        const snapshot = await indexedDbAdapter.loadWorkspace();
        if (snapshot) {
          initialDataRef.current = snapshot.data;
          initializeSnapshotMeta(snapshot.savedAt);
        }
      } catch {
        // Aucune sauvegarde locale exploitable : on démarre avec les données de démonstration.
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const value: WorkspaceSnapshotContextValue = {
    getInitialValue: (key, fallback) => {
      const stored = initialDataRef.current[key];
      return stored === undefined ? fallback : (stored as typeof fallback);
    },
  };

  return <WorkspaceSnapshotContext.Provider value={value}>{children}</WorkspaceSnapshotContext.Provider>;
}
