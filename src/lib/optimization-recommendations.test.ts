import { describe, expect, it } from "vitest";
import { buildOptimizationRecommendations, type OptimizationInput } from "@/lib/optimization-recommendations";
import type { PerformedPublication } from "@/lib/analytics-report";

function fixturePublication(overrides: Partial<PerformedPublication> = {}): PerformedPublication {
  return {
    id: "pub-1",
    brand: "Acme",
    platform: "linkedin",
    format: "text",
    scheduledFor: "2026-08-01T09:00:00.000Z",
    timeZone: "Europe/Paris",
    theme: "Conseils",
    excerpt: "5 conseils pratiques",
    text: "...",
    cta: "",
    hashtags: [],
    media: [],
    status: "published",
    owner: "",
    approver: "",
    comments: [],
    history: [],
    engagementRate: 4.2,
    performance: {
      source: "imported",
      impressions: 1000,
      reach: 800,
      views: 0,
      interactions: 34,
      reactions: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      newFollowers: 0,
      conversions: 0,
    },
    ...overrides,
  } as unknown as PerformedPublication;
}

const EMPTY_TOTALS = {
  impressions: 0,
  reach: 0,
  views: 0,
  interactions: 0,
  reactions: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  clicks: 0,
  newFollowers: 0,
  conversions: 0,
  engagementRate: 0,
};

const BASE_INPUT: OptimizationInput = {
  topFormat: null,
  topTheme: null,
  topPlatform: null,
  topCta: null,
  bestTimeSlot: null,
  currentTotals: EMPTY_TOTALS,
  previousTotals: null,
  topPublications: [],
  worstPublications: [],
  publishedCount: 0,
  periodDays: 30,
  brand: undefined,
};

describe("buildOptimizationRecommendations — honesty guarantee (RÈGLE ABSOLUE: never fabricate performance)", () => {
  it("says explicitly there isn't enough data, rather than fabricating a recommendation, when nothing qualifies", () => {
    const recommendations = buildOptimizationRecommendations(BASE_INPUT);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe("no-data");
    expect(recommendations[0].text).toContain("Pas assez de données");
    expect(recommendations[0].actions).toEqual([]);
  });

  it("never fabricates a topFormat/topTheme/topPlatform recommendation when the corresponding input is null", () => {
    const recommendations = buildOptimizationRecommendations({ ...BASE_INPUT, publishedCount: 3 });
    expect(recommendations.some((r) => r.id === "top-format")).toBe(false);
    expect(recommendations.some((r) => r.id === "top-theme")).toBe(false);
    expect(recommendations.some((r) => r.id === "top-platform")).toBe(false);
  });
});

describe("buildOptimizationRecommendations — top/worst performer surfacing (Chantier boucle d'optimisation)", () => {
  it("surfaces the top-performing publication with a real, traceable action", () => {
    const top = fixturePublication({ id: "top-1", excerpt: "Le meilleur post", engagementRate: 9.1 });
    const recommendations = buildOptimizationRecommendations({ ...BASE_INPUT, topPublications: [top] });
    const found = recommendations.find((r) => r.id === "top-performer-top-1");
    expect(found).toBeDefined();
    expect(found?.text).toContain("Le meilleur post");
    expect(found?.text).toContain("9.1");
    expect(found?.sourcePublication?.id).toBe("top-1");
    expect(found?.actions).toContain("variant");
  });

  it("surfaces the worst-performing publication only as a hypothesis, never a certainty", () => {
    const worst = fixturePublication({ id: "worst-1", excerpt: "Le moins bon post", engagementRate: 0.4 });
    const recommendations = buildOptimizationRecommendations({ ...BASE_INPUT, worstPublications: [worst] });
    const found = recommendations.find((r) => r.id === "recycle-worst-1");
    expect(found).toBeDefined();
    expect(found?.kind).toBe("hypothesis");
  });

  it("every recommendation always states its data basis, never a bare unexplained claim", () => {
    const recommendations = buildOptimizationRecommendations({
      ...BASE_INPUT,
      topFormat: { key: "carousel", label: "Carrousel", engagementRate: 6.2, count: 4, sources: { hasImported: true, hasDemo: false } },
      publishedCount: 4,
    });
    for (const recommendation of recommendations) {
      expect(recommendation.dataBasis.length).toBeGreaterThan(0);
    }
  });
});
