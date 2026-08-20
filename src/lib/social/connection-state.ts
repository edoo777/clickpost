import type { SocialAccount } from "@/types/dashboard";
import type { OAuthConnectionSummary } from "@/types/oauth-connection";

/** Dérive l'état de connexion détaillé d'un compte social à partir de faits déjà connus (compte
 * local, expiration, portées accordées) — jamais un état optimiste par défaut. Généralisation de
 * `src/lib/linkedin/connection-state.ts` (paramétrée par les portées minimales requises au lieu
 * de `LINKEDIN_MEMBER_SCOPES` codées en dur) — LinkedIn garde sa propre copie, jamais touchée
 * ici. Sûr à appeler côté client : ne lit que `SocialAccount`, jamais un jeton ni une variable
 * d'environnement serveur directement. */
export function computeSocialConnectionState(
  account: SocialAccount | undefined,
  serverConfigured: boolean,
  requiredScopes: string[]
): OAuthConnectionSummary {
  if (!serverConfigured) {
    return { state: "not_configured", scopes: [], tokenExpiresAt: null, lastCheckedAt: null, externalAccountId: null };
  }
  if (!account) {
    return { state: "no_local_account", scopes: [], tokenExpiresAt: null, lastCheckedAt: null, externalAccountId: null };
  }

  const base: Omit<OAuthConnectionSummary, "state"> = {
    scopes: account.oauthScopes ?? [],
    tokenExpiresAt: account.tokenExpiresAt ?? null,
    lastCheckedAt: account.lastCheckedAt ?? null,
    externalAccountId: account.externalAccountId ?? null,
  };

  if (account.status === "profile_only") return { state: "local_profile_only", ...base };
  if (account.status === "disconnected") return { state: "disconnected", ...base };
  if (account.status === "insufficient_permission") {
    return { state: "insufficient_permission", ...base, message: "Portée manquante pour cette action." };
  }
  if (account.status === "error") return { state: "persistent_error", ...base };
  if (account.status === "syncing") return { state: "temporary_error", ...base };

  if (account.status === "expired") return { state: "token_expired", ...base };
  if (account.status === "connected") {
    const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt).getTime() : null;
    if (expiresAt !== null && expiresAt <= Date.now()) return { state: "token_expired", ...base };
    const missingRequiredScope = !requiredScopes.every((scope) => (account.oauthScopes ?? []).includes(scope));
    if (missingRequiredScope) return { state: "insufficient_permission", ...base, message: "Portée de publication manquante." };
    return { state: "connected", ...base };
  }

  return { state: "no_local_account", scopes: [], tokenExpiresAt: null, lastCheckedAt: null, externalAccountId: null };
}
