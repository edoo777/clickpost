import { refreshPageToken } from "@/lib/meta/oauth";
import { getValidAccessToken as genericGetValidAccessToken, saveConnection, deleteConnection } from "@/lib/social/connections";

export { saveConnection, deleteConnection };

/** `pageId` = identifiant de la Page Facebook liée au compte professionnel Instagram (jamais
 * l'identifiant Instagram lui-même) — c'est la Page, pas le compte Instagram, qui porte le jeton
 * réellement utilisable (voir src/lib/meta/oauth.ts, fetchManagedPages). Stocké séparément sur le
 * compte affilié lors de la connexion (voir src/app/api/social/instagram/callback/route.ts). */
export async function getValidAccessToken(workspaceId: string, accountId: string, tokenExpiresAt: string | null, linkedFacebookPageId: string) {
  return genericGetValidAccessToken(workspaceId, accountId, tokenExpiresAt, "instagram", (refreshToken) =>
    refreshPageToken("instagram", refreshToken, linkedFacebookPageId)
  );
}
