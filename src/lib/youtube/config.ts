import { isTokenEncryptionConfigured } from "@/lib/oauth/token-encryption";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** `youtube.upload` pour publier, `youtube.readonly` pour identifier la chaîne connectée (voir
 * fetchYouTubeIdentity) — jamais une portée de gestion plus large que nécessaire. Distinct de
 * `YOUTUBE_API_KEY` (déjà utilisée par src/lib/trends/youtube-provider.ts pour la lecture
 * publique des vidéos populaires, sans OAuth) : cette intégration-ci est un flux OAuth2 complet
 * et entièrement séparé, nécessaire pour publier au nom d'un utilisateur — une simple clé API ne
 * permet jamais d'action d'écriture sur un compte. */
export const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];

export interface YouTubeConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function trimmed(name: string): string | undefined {
  return process.env[name]?.trim();
}

export function getYouTubeConfig(): YouTubeConfig | null {
  const clientId = trimmed("YOUTUBE_OAUTH_CLIENT_ID");
  const clientSecret = trimmed("YOUTUBE_OAUTH_CLIENT_SECRET");
  const redirectUri = trimmed("YOUTUBE_OAUTH_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isYouTubeOAuthConfigured(): boolean {
  return getYouTubeConfig() !== null && isTokenEncryptionConfigured() && isServiceRoleConfigured();
}

type YouTubePrivacyStatus = "private" | "unlisted" | "public";
const VALID_PRIVACY_STATUSES: YouTubePrivacyStatus[] = ["private", "unlisted", "public"];

/** `private` par défaut — jamais `public` sans un choix explicite de votre part (voir
 * docs/social-platform-setup.md) : une vidéo publiée reste bien plus difficile à "retirer
 * proprement" qu'un post supprimé sur les autres réseaux. Définissez
 * `YOUTUBE_DEFAULT_PRIVACY_STATUS=public` (ou `unlisted`) uniquement une fois la première
 * intégration vérifiée manuellement. */
export function getYouTubeDefaultPrivacyStatus(): YouTubePrivacyStatus {
  const raw = trimmed("YOUTUBE_DEFAULT_PRIVACY_STATUS");
  return raw && (VALID_PRIVACY_STATUSES as string[]).includes(raw) ? (raw as YouTubePrivacyStatus) : "private";
}
