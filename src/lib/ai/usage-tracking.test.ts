import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "@/lib/ai/usage-tracking";

describe("estimateCostUsd", () => {
  it("computes cost from real input/output token counts for a known model", () => {
    // claude-sonnet-5 : 3 $ / million input, 15 $ / million output.
    const cost = estimateCostUsd("claude-sonnet-5", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(18, 5);
  });

  it("returns 0 for a call with no tokens", () => {
    expect(estimateCostUsd("claude-sonnet-5", 0, 0)).toBe(0);
  });

  it("falls back to the default price table for an unrecognized model rather than throwing", () => {
    const cost = estimateCostUsd("some-future-model", 1_000_000, 0);
    expect(cost).toBeGreaterThan(0);
  });

  it("scales linearly with token count", () => {
    const small = estimateCostUsd("claude-haiku-4-5-20251001", 1000, 500);
    const large = estimateCostUsd("claude-haiku-4-5-20251001", 10_000, 5000);
    expect(large).toBeCloseTo(small * 10, 6);
  });
});
