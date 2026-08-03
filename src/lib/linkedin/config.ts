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

export function getLinkedInConfig(): LinkedInConfig | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const apiVersion = process.env.LINKEDIN_API_VERSION;
  if (!clientId || !clientSecret || !redirectUri || !apiVersion) return null;
  return { clientId, clientSecret, redirectUri, apiVersion };
}

/** Vrai uniquement si l'application LinkedIn, le chiffrement des jetons ET l'accès service_role
 * (stockage sécurisé) sont tous les trois configurés — jamais un "presque configuré". */
export function isLinkedInOAuthConfigured(): boolean {
  return getLinkedInConfig() !== null && isTokenEncryptionConfigured() && isServiceRoleConfigured();
}
