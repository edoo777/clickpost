/**
 * Fabrique générique de magasin externe (sessionStorage + `useSyncExternalStore`) pour de
 * petits états d'affichage locaux à l'onglet (vue active, filtres, position) — au même titre
 * que le thème ou l'état de la sidebar, jamais des données de workspace. Chaque appelant fournit
 * sa propre clé de stockage pour rester isolé des autres (ex. page Calendrier dédiée vs vue
 * Calendrier intégrée dans Publications, qui doivent pouvoir diverger — voir point 6).
 */
export function createSessionStore<T extends object>(storageKey: string, defaultState: T) {
  type Listener = () => void;
  const listeners = new Set<Listener>();
  let currentState: T = defaultState;
  let hydrated = false;

  function notifyListeners() {
    listeners.forEach((listener) => listener());
  }

  function readStored(): T | null {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return null;
      return { ...defaultState, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return null;
    }
  }

  function writeStored(state: T) {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(state));
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
  };
}
