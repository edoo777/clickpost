/**
 * Garde-fou anti-double-échange pour le callback OAuth LinkedIn — en mémoire process, sans
 * nouvelle table. Un `code` d'autorisation LinkedIn est à usage unique côté LinkedIn ; un second
 * appel avec le même code échouerait de toute façon chez LinkedIn (invalid_grant), mais on évite
 * ici même ce second appel réseau et on renvoie exactement le même résultat que la première
 * tentative — utile en développement, où un rechargement de route (Turbopack), une requête
 * dupliquée par le navigateur, ou un double rendu peuvent déclencher le callback deux fois pour
 * la même redirection LinkedIn.
 */
const TTL_MS = 2 * 60 * 1000;

interface CachedOutcome {
  redirectPath: string;
  expiresAt: number;
}

const processedCodes = new Map<string, CachedOutcome>();

function purgeExpired() {
  const now = Date.now();
  for (const [key, value] of processedCodes) {
    if (value.expiresAt <= now) processedCodes.delete(key);
  }
}

export function getCachedCallbackOutcome(code: string): string | null {
  purgeExpired();
  return processedCodes.get(code)?.redirectPath ?? null;
}

export function cacheCallbackOutcome(code: string, redirectPath: string): void {
  purgeExpired();
  processedCodes.set(code, { redirectPath, expiresAt: Date.now() + TTL_MS });
}
