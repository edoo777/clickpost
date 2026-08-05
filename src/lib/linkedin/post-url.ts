/**
 * Dérive l'URL publique d'un post LinkedIn à partir de son URN réel (`urn:li:share:...` ou
 * `urn:li:ugcPost:...`, tel que renvoyé par l'en-tête `x-restli-id` de l'API Posts — voir
 * client.ts) — jamais une URL devinée pour un identifiant absent ou mal formé.
 */
export function buildLinkedInPostUrl(externalPostId: string | undefined | null): string | null {
  if (!externalPostId || !externalPostId.startsWith("urn:li:")) return null;
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(externalPostId)}/`;
}
