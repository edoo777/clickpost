import { refreshPageToken } from "@/lib/meta/oauth";
import { getValidAccessToken as genericGetValidAccessToken, saveConnection, deleteConnection } from "@/lib/social/connections";

export { saveConnection, deleteConnection };

/** `pageId` = `account.externalAccountId` (l'identifiant de la Page Facebook) — nécessaire pour
 * re-dériver un jeton de Page à jour en cas de rafraîchissement (voir refreshPageToken). */
export async function getValidAccessToken(workspaceId: string, accountId: string, tokenExpiresAt: string | null, pageId: string) {
  return genericGetValidAccessToken(workspaceId, accountId, tokenExpiresAt, "facebook", (refreshToken) =>
    refreshPageToken("facebook", refreshToken, pageId)
  );
}
