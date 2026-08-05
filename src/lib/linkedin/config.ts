import { isTokenEncryptionConfigured } from "@/lib/oauth/token-encryption";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** Portées minimales demandées au premier test (section 4 du mandat) : authentification +
 * identification (OpenID Connect) et publication au nom du membre. Jamais de portée
 * supplémentaire réclamée sans besoin réel (`w_organization_social` etc. restent pour plus
 * tard, une fois l'architecture Page Entreprise réellement utilisée). */
export const LINKEDIN_MEMBER_SCOPES = ["openid", "profile", "email", "w_member_social"];

/** Ne préfixer aucune de ces variables par NEXT_PUBLIC_ — toutes doivent rester côté serveur
 * uniquement (voir .env.example). */
export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiVersion: string;
}

/** `.trim()` sur chaque valeur : un `.env.local` édité à la main accumule facilement un espace ou
 * un retour à la ligne de fin (déjà observé dans ce projet sur d'autres variables) — silencieux
 * dans la plupart des cas, mais fatal pour `clientSecret`/`clientId` : LinkedIn compare la valeur
 * exacte et rejette tout caractère parasite sans message explicite côté ClickPost au-delà d'un
 * échec d'échange générique. */
export function getLinkedInConfig(): LinkedInConfig | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI?.trim();
  const apiVersion = process.env.LINKEDIN_API_VERSION?.trim();
  if (!clientId || !clientSecret || !redirectUri || !apiVersion) return null;
  return { clientId, clientSecret, redirectUri, apiVersion };
}

/** Vrai uniquement si l'application LinkedIn, le chiffrement des jetons ET l'accès service_role
 * (stockage sécurisé) sont tous les trois configurés — jamais un "presque configuré". */
export function isLinkedInOAuthConfigured(): boolean {
  return getLinkedInConfig() !== null && isTokenEncryptionConfigured() && isServiceRoleConfigured();
}
