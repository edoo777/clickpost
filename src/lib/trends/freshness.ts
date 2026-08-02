export function formatFreshness(collectedAt: string, cacheAgeMs?: number): string {
  const ageMs = cacheAgeMs ?? Date.now() - new Date(collectedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return "à l'instant";
  const minutes = Math.round(ageMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

/** Périmée = plus ancienne que la durée de cache attendue pour sa catégorie — jamais affiché
 * comme « temps réel » au-delà. */
export function isStale(cacheAgeMs: number, ttlMs: number): boolean {
  return cacheAgeMs > ttlMs;
}
