import { isTokenEncryptionConfigured } from "@/lib/oauth/token-encryption";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** Portées minimales pour publier une vidéo et lire l'identité du compte — voir
 * https://developers.tiktok.com/doc/tiktok-api-scopes. `video.publish` nécessite un audit
 * TikTok de l'application avant tout accès en production (voir docs/social-platform-setup.md) ;
 * sans audit approuvé, TikTok autorise uniquement des publications en mode "brouillon" envoyées
 * dans la boîte de réception du créateur (jamais publiées automatiquement malgré un appel API
 * réussi) — ClickPost ne prétend jamais qu'une vidéo est publique tant que TikTok ne le confirme
 * pas explicitement dans la réponse de statut. */
export const TIKTOK_SCOPES = ["user.info.basic", "video.publish"];

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
}

function trimmed(name: string): string | undefined {
  return process.env[name]?.trim();
}

export function getTikTokConfig(): TikTokConfig | null {
  const clientKey = trimmed("TIKTOK_CLIENT_KEY");
  const clientSecret = trimmed("TIKTOK_CLIENT_SECRET");
  const redirectUri = trimmed("TIKTOK_REDIRECT_URI");
  if (!clientKey || !clientSecret || !redirectUri) return null;
  return { clientKey, clientSecret, redirectUri };
}

export function isTikTokOAuthConfigured(): boolean {
  return getTikTokConfig() !== null && isTokenEncryptionConfigured() && isServiceRoleConfigured();
}
