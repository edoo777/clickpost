/**
 * Limiteur de requêtes dédié aux routes /api/ia/tendances/* — distinct de lib/ai/rate-limit.ts
 * (réservé aux appels Claude, budget par nature plus contraint). Les routes tendances/youtube et
 * tendances/news ne consomment que des quotas d'API externes déjà protégés par le cache serveur
 * (lib/trends/cache.ts) ; ce plafond n'est qu'un filet contre un usage anormal, pas une
 * protection de coût Claude.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function checkTrendsRateLimit(userId: string): RateLimitResult {
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
