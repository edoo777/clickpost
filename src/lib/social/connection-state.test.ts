import { describe, expect, it } from "vitest";
import { computeSocialConnectionState } from "@/lib/social/connection-state";
import type { SocialAccount } from "@/types/dashboard";

const REQUIRED_SCOPES = ["scope.read", "scope.write"];

function account(overrides: Partial<SocialAccount>): SocialAccount {
  return {
    id: "acc-1",
    platform: "instagram",
    brand: "Marque",
    accountName: "Compte",
    handle: "@compte",
    status: "connected",
    lastSyncedAt: null,
    permissions: [],
    ...overrides,
  };
}

describe("computeSocialConnectionState — dérivation générique, jamais optimiste par défaut", () => {
  it("renvoie not_configured quand le serveur n'a pas les identifiants, quel que soit l'état du compte", () => {
    const result = computeSocialConnectionState(account({ status: "connected", oauthScopes: REQUIRED_SCOPES }), false, REQUIRED_SCOPES);
    expect(result.state).toBe("not_configured");
  });

  it("renvoie no_local_account quand aucun compte local n'existe", () => {
    const result = computeSocialConnectionState(undefined, true, REQUIRED_SCOPES);
    expect(result.state).toBe("no_local_account");
  });

  it("renvoie connected uniquement si toutes les portées requises sont accordées et le jeton n'est pas expiré", () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const result = computeSocialConnectionState(
      account({ status: "connected", oauthScopes: REQUIRED_SCOPES, tokenExpiresAt: futureExpiry }),
      true,
      REQUIRED_SCOPES
    );
    expect(result.state).toBe("connected");
  });

  it("renvoie insufficient_permission si une portée requise manque, même si le compte est 'connected'", () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const result = computeSocialConnectionState(
      account({ status: "connected", oauthScopes: ["scope.read"], tokenExpiresAt: futureExpiry }),
      true,
      REQUIRED_SCOPES
    );
    expect(result.state).toBe("insufficient_permission");
  });

  it("renvoie token_expired si le jeton est expiré, même si le statut stocké est encore 'connected'", () => {
    const pastExpiry = new Date(Date.now() - 60 * 1000).toISOString();
    const result = computeSocialConnectionState(
      account({ status: "connected", oauthScopes: REQUIRED_SCOPES, tokenExpiresAt: pastExpiry }),
      true,
      REQUIRED_SCOPES
    );
    expect(result.state).toBe("token_expired");
  });

  it("renvoie local_profile_only pour un compte jamais connecté par OAuth", () => {
    const result = computeSocialConnectionState(account({ status: "profile_only" }), true, REQUIRED_SCOPES);
    expect(result.state).toBe("local_profile_only");
  });
});
