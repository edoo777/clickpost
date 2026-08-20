import { refreshAccessToken } from "@/lib/youtube/oauth";
import { getValidAccessToken as genericGetValidAccessToken, saveConnection, deleteConnection } from "@/lib/social/connections";

export { saveConnection, deleteConnection };

export async function getValidAccessToken(workspaceId: string, accountId: string, tokenExpiresAt: string | null) {
  return genericGetValidAccessToken(workspaceId, accountId, tokenExpiresAt, "youtube", refreshAccessToken);
}
