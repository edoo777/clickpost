import { createHash, randomBytes } from "node:crypto";

/**
 * PKCE (RFC 7636) — X impose ce mécanisme même pour un client confidentiel (contrairement à la
 * plupart des autres plateformes de ce projet), voir
 * https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/user-access-token.
 * `code_verifier` voyage dans le `state` signé (voir OAuthStatePayload.codeVerifier) — jamais
 * stocké côté serveur séparément.
 */
export function generateCodeVerifier(): string {
  return randomBytes(48).toString("base64url");
}

export function deriveCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}
