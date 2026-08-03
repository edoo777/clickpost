/**
 * Cache serveur en mémoire processus, par clé — même limite assumée que rate-limit.ts
 * (réinitialisé à chaque redémarrage, non partagé entre plusieurs instances). Seul mécanisme de
 * mise en cache des tendances : jamais de rafraîchissement continu en arrière-plan, uniquement à
 * la demande (chargement de page, bouton « Actualiser ») et seulement si l'entrée a expiré.
 */

interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  ttlMs: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): { value: T; ageMs: number } | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  const ageMs = Date.now() - entry.cachedAt;
  if (ageMs > entry.ttlMs) {
    store.delete(key);
    return null;
  }
  return { value: entry.value, ageMs };
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, cachedAt: Date.now(), ttlMs });
}

/** Ignore le cache et force une nouvelle collecte — utilisé uniquement par le bouton
 * « Actualiser », jamais automatiquement. */
export function invalidateCached(key: string): void {
  store.delete(key);
}

export const CACHE_TTL_YOUTUBE_MS = 45 * 60_000; // 30–60 min
export const CACHE_TTL_NEWS_MS = 3 * 60 * 60_000; // 1–6 h

// Veille Web (Claude + web_search) — durées MVP fournies par le produit.
export const CACHE_TTL_WEB_TREND_MS = 3 * 60 * 60_000; // tendances générales et par niche/thématique
export const CACHE_TTL_WEB_MUSIC_MS = 6 * 60 * 60_000; // musiques et sons
export const CACHE_TTL_WEB_NO_SIGNAL_MS = 60 * 60_000; // aucun signal fiable trouvé — nouvelle tentative plus tôt
