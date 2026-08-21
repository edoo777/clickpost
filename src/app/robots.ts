import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/marketing/site-url";

/**
 * robots.txt généré — n'autorise l'exploration que du site public (marketing, blog, légal).
 * Le tableau de bord authentifié et les routes API restent explicitement exclues : elles ne sont
 * de toute façon jamais accessibles sans session (voir proxy.ts), mais un moteur de recherche ne
 * devrait même pas essayer de les indexer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/bienvenue", "/solution", "/prix", "/ressources", "/blog", "/contact", "/conditions", "/confidentialite", "/cookies"],
      disallow: ["/api/", "/admin/", "/parametres", "/publications", "/calendrier", "/comptes", "/rapports", "/onboarding"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
