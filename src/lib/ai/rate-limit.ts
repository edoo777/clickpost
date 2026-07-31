/**
 * Limiteur de requêtes local, par utilisateur, en mémoire processus — première protection
 * contre les abus/dépenses excessives pour F2.1. Limite assumée : réinitialisé à chaque
 * redémarrage du serveur, non partagé entre plusieurs instances. Un mécanisme persisté
 * (table Supabase, migration séparée avec dry-run) est envisagé pour une phase ultérieure
 * si le besoin se confirme — volontairement hors de F2.1 (aucune migration ici).
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const previous = requestLog.get(userId) ?? [];
  const withinWindow = previous.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (withinWindow.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = withinWindow[0];
    requestLog.set(userId, withinWindow);
    return { allowed: false, retryAfterMs: Math.max(0, WINDOW_MS - (now - oldest)) };
  }

  withinWindow.push(now);
  requestLog.set(userId, withinWindow);
  return { allowed: true, retryAfterMs: 0 };
}
