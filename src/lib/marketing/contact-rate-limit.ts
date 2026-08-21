/**
 * Limiteur de requêtes dédié au formulaire de contact public (`/api/marketing/contact`) — routes
 * accessibles sans authentification, donc jamais clé par `userId` (voir
 * src/lib/trends/rate-limit.ts pour l'équivalent authentifié) : clé par adresse IP du visiteur.
 * Filet anti-spam simple, pas une protection anti-bot sophistiquée.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function checkContactRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const previous = requestLog.get(ip) ?? [];
  const withinWindow = previous.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (withinWindow.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = withinWindow[0];
    requestLog.set(ip, withinWindow);
    return { allowed: false, retryAfterMs: Math.max(0, WINDOW_MS - (now - oldest)) };
  }

  withinWindow.push(now);
  requestLog.set(ip, withinWindow);
  return { allowed: true, retryAfterMs: 0 };
}
