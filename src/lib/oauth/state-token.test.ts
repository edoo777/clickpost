import { afterEach, describe, expect, it, vi } from "vitest";
import { createOAuthState, verifyOAuthState } from "@/lib/oauth/state-token";

const SECRET = "test-secret-value";

describe("OAuth state token — signature et vérification", () => {
  it("accepte un state valide et restitue exactement le payload d'origine", () => {
    const state = createOAuthState({ workspaceId: "ws-1", brandId: "brand-1", userId: "user-1", platform: "instagram" }, SECRET);
    const result = verifyOAuthState(state, SECRET);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.workspaceId).toBe("ws-1");
      expect(result.payload.brandId).toBe("brand-1");
      expect(result.payload.userId).toBe("user-1");
      expect(result.payload.platform).toBe("instagram");
    }
  });

  it("transporte le code_verifier PKCE optionnel (X) sans l'altérer", () => {
    const state = createOAuthState({ workspaceId: "ws-1", brandId: null, userId: "user-1", platform: "x", codeVerifier: "verifier-abc" }, SECRET);
    const result = verifyOAuthState(state, SECRET);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload.codeVerifier).toBe("verifier-abc");
  });

  it("n'ajoute aucun champ codeVerifier quand il est omis (LinkedIn/Meta/TikTok/YouTube) — jamais 'undefined' littéral dans le state signé", () => {
    const state = createOAuthState({ workspaceId: "ws-1", brandId: null, userId: "user-1", platform: "linkedin" }, SECRET);
    const [encoded] = state.split(".");
    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, unknown>;
    expect("codeVerifier" in decoded).toBe(false);
  });

  it("rejette une signature invalide (secret différent) — jamais accepté comme 'probablement valide'", () => {
    const state = createOAuthState({ workspaceId: "ws-1", brandId: null, userId: "user-1", platform: "facebook" }, SECRET);
    const result = verifyOAuthState(state, "wrong-secret");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("invalid_signature");
  });

  it("rejette un state malformé (structure incorrecte)", () => {
    const result = verifyOAuthState("not-a-valid-state", SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("malformed");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejette un state expiré au-delà de la fenêtre de validité (10 minutes)", () => {
    const state = createOAuthState({ workspaceId: "ws-1", brandId: null, userId: "user-1", platform: "tiktok" }, SECRET);
    expect(verifyOAuthState(state, SECRET).valid).toBe(true); // valide immédiatement après émission.

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 11 * 60 * 1000); // 11 minutes plus tard, au-delà des 10 minutes.
    const result = verifyOAuthState(state, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });
});
