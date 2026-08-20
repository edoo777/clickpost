import { isTokenEncryptionConfigured } from "@/lib/oauth/token-encryption";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

/**
 * Instagram et Facebook partagent une seule et même application Meta ("Meta App", créée sur
 * developers.facebook.com) — c'est ainsi que l'API Meta est réellement conçue : un seul
 * `client_id`/`client_secret`, un seul flux OAuth Facebook Login, les Pages Facebook ET les
 * comptes professionnels Instagram qui leur sont liés sont ensuite listés via les mêmes appels
 * Graph API (`/me/accounts`, puis `instagram_business_account` sur chaque Page). Ne jamais
 * dupliquer ces identifiants sous deux noms de variable différents : ce serait recréer une
 * fausse distinction que Meta lui-même n'a pas. Seule l'URL de redirection diffère (une par
 * produit, toutes deux déclarées dans la même Meta App), pour que le callback sache directement
 * quel flux traiter sans dépendre uniquement du `state`.
 */
export const FACEBOOK_SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];
/** `pages_show_list` est également nécessaire pour Instagram : un compte professionnel Instagram
 * n'est accessible qu'à travers la Page Facebook à laquelle il est lié, jamais directement. */
export const INSTAGRAM_SCOPES = ["pages_show_list", "instagram_basic", "instagram_content_publish"];

export interface MetaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiVersion: string;
}

function trimmed(name: string): string | undefined {
  return process.env[name]?.trim();
}

export function getMetaConfig(product: "instagram" | "facebook"): MetaConfig | null {
  const clientId = trimmed("META_CLIENT_ID");
  const clientSecret = trimmed("META_CLIENT_SECRET");
  const apiVersion = trimmed("META_API_VERSION");
  const redirectUri = trimmed(product === "instagram" ? "META_INSTAGRAM_REDIRECT_URI" : "META_FACEBOOK_REDIRECT_URI");
  if (!clientId || !clientSecret || !apiVersion || !redirectUri) return null;
  return { clientId, clientSecret, apiVersion, redirectUri };
}

export function isMetaOAuthConfigured(product: "instagram" | "facebook"): boolean {
  return getMetaConfig(product) !== null && isTokenEncryptionConfigured() && isServiceRoleConfigured();
}
