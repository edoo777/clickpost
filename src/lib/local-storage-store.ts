/**
 * Fabrique générique de magasin externe (localStorage + `useSyncExternalStore`) pour de petites
 * préférences d'affichage qui doivent survivre à la fermeture de l'onglet/du navigateur — par
 * opposition à `session-storage-store.ts` (état de session, effacé à la fermeture de l'onglet,
 * utilisé pour les filtres/le défilement/la vue active). Réservé aux préférences purement
 * locales à l'appareil (ex. largeur de colonne) — jamais une donnée de workspace, qui doit
 * toujours passer par le moteur de synchronisation (`useSyncedPersistedState`) pour rester
 * partagée entre appareils.
 */
export function createLocalStore<T extends object>(storageKey: string, defaultState: T) {
  type Listener = () => void;
  const listeners = new Set<Listener>();
  let currentState: T = defaultState;
  let hydrated = false;

  function notifyListeners() {
    listeners.forEach((listener) => listener());
  }

  function readStored(): T | null {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      return { ...defaultState, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return null;
    }
  }

  function writeStored(state: T) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Stockage indisponible (navigation privée stricte, quota) — dégrade silencieusement.
    }
  }

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    const stored = readStored();
    if (stored) currentState = stored;
  }

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): T {
      ensureHydrated();
      return currentState;
    },
    getServerSnapshot(): T {
      return defaultState;
    },
    patch(partial: Partial<T>) {
      ensureHydrated();
      currentState = { ...currentState, ...partial };
      writeStored(currentState);
      notifyListeners();
    },
    reset() {
      currentState = defaultState;
      writeStored(currentState);
      notifyListeners();
    },
  };
}
