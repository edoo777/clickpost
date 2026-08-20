import { isTokenEncryptionConfigured } from "@/lib/oauth/token-encryption";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** `offline.access` est ce qui permet à X de délivrer un jeton de rafraîchissement — sans cette
 * portée, le jeton d'accès expire (2 heures) sans aucun moyen de le renouveler silencieusement,
 * imposant une reconnexion complète à chaque expiration. */
export const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

export interface XConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function trimmed(name: string): string | undefined {
  return process.env[name]?.trim();
}

export function getXConfig(): XConfig | null {
  const clientId = trimmed("X_CLIENT_ID");
  const clientSecret = trimmed("X_CLIENT_SECRET");
  const redirectUri = trimmed("X_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isXOAuthConfigured(): boolean {
  return getXConfig() !== null && isTokenEncryptionConfigured() && isServiceRoleConfigured();
}
