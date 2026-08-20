import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { deriveCodeChallenge, generateCodeVerifier } from "@/lib/x/pkce";

describe("PKCE (X) — génération et dérivation", () => {
  it("génère un code_verifier suffisamment long et sans caractères interdits par RFC 7636", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("génère un code_verifier différent à chaque appel (jamais un secret PKCE réutilisé)", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });

  it("dérive le code_challenge S256 conformément à RFC 7636 (BASE64URL(SHA256(verifier)))", () => {
    const verifier = "test-code-verifier-value-1234567890";
    const expected = createHash("sha256").update(verifier).digest("base64url");
    expect(deriveCodeChallenge(verifier)).toBe(expected);
  });
});
