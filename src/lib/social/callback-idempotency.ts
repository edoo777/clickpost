/**
 * Garde-fou anti-double-échange générique pour tout callback OAuth social — en mémoire process,
 * sans nouvelle table. Un `code` d'autorisation est à usage unique côté fournisseur ; un second
 * appel avec le même code échouerait de toute façon (invalid_grant), mais on évite ici même ce
 * second appel réseau et on renvoie exactement le même résultat que la première tentative — utile
 * en développement (rechargement de route, requête dupliquée par le navigateur, double rendu).
 *
 * Clé composite `platform:code` — un même Map partagé par toutes les plateformes, jamais de
 * collision entre elles même si deux fournisseurs émettaient un jour un code de forme identique.
 * Copie générique du principe déjà utilisé par `src/lib/linkedin/callback-idempotency.ts`
 * (dupliqué, jamais réutilisé directement, pour ne jamais risquer de toucher LinkedIn).
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

export function getCachedCallbackOutcome(platform: string, code: string): string | null {
  purgeExpired();
  return processedCodes.get(`${platform}:${code}`)?.redirectPath ?? null;
}

export function cacheCallbackOutcome(platform: string, code: string, redirectPath: string): void {
  purgeExpired();
  processedCodes.set(`${platform}:${code}`, { redirectPath, expiresAt: Date.now() + TTL_MS });
}
