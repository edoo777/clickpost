/**
 * URL de base du site public — jamais un domaine de production deviné. Utilise
 * `NEXT_PUBLIC_SITE_URL` si définie (à renseigner une fois le domaine réel choisi, voir
 * .env.example), sinon l'URL Vercel générée automatiquement pour ce déploiement
 * (`VERCEL_URL`, réelle, jamais fabriquée), sinon `http://localhost:3000` en développement local.
 * Utilisé uniquement pour des métadonnées techniques (robots.txt, sitemap.xml) — jamais affiché
 * comme contenu visible à l'utilisateur.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}
