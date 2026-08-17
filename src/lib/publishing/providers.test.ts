import { describe, expect, it } from "vitest";
import { getPublishProvider, isAutomaticPublishingAvailable } from "@/lib/publishing/providers";

describe("Social Provider registry", () => {
  it("routes LinkedIn through the real provider, not a permanently-unconfigured stub", () => {
    // Régression : le registre renvoyait autrefois un fournisseur "non configuré" pour LinkedIn
    // aussi, alors qu'un fournisseur réel existe (src/lib/linkedin/provider.ts) — ManualPublishPanel
    // affichait donc « Aucune intégration API n'est configurée pour linkedin » à côté d'un vrai
    // bouton de publication automatique fonctionnel, un message contradictoire et trompeur.
    const provider = getPublishProvider("linkedin");
    expect(provider.platform).toBe("linkedin");
    expect(provider.capabilities().automaticPublish).toBe(true);
    // isConfigured() reflète la vraie configuration serveur (ANTHROPIC_* n'a aucun rapport ici) —
    // dans cet environnement de test, les variables LinkedIn ne sont pas présentes, donc false ;
    // le test vérifie la cohérence interne (isAutomaticPublishingAvailable == isConfigured()),
    // pas une valeur figée qui dépendrait de l'environnement d'exécution.
    expect(isAutomaticPublishingAvailable("linkedin")).toBe(provider.isConfigured());
  });

  it("declares every platform's capabilities without ever claiming automatic publish is configured by default", () => {
    const platforms = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x", "threads", "pinterest", "other"] as const;
    for (const platform of platforms) {
      const provider = getPublishProvider(platform);
      expect(provider.platform).toBe(platform);
      expect(typeof provider.capabilities().automaticPublish).toBe("boolean");
      // Sans identifiants réels configurés dans cet environnement, aucune plateforme ne doit se
      // déclarer "configurée" — jamais un envoi automatique optimiste par défaut.
      if (platform !== "linkedin") {
        expect(provider.isConfigured()).toBe(false);
      }
    }
  });

  it("never returns success from an unconfigured provider's publish()", async () => {
    const provider = getPublishProvider("instagram");
    expect(provider.isConfigured()).toBe(false);
    const result = await provider.publish({
      publication: {} as never,
      account: {} as never,
      workspaceId: "ws-1",
      idempotencyKey: "key-1",
    });
    expect(result.status).toBe("failed");
    expect(result.isPermanent).toBe(true);
  });

  it("exposes fetchPerformance honestly (not_supported rather than fabricated metrics) when unconfigured", async () => {
    const provider = getPublishProvider("tiktok");
    expect(provider.fetchPerformance).toBeDefined();
    const result = await provider.fetchPerformance?.({ publication: {} as never, account: {} as never });
    expect(result?.status).toBe("not_supported");
  });
});
