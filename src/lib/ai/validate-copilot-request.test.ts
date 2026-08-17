import { describe, expect, it } from "vitest";
import { validateCopilotRequest } from "@/lib/ai/validate-copilot-request";

const VALID_UUID = "11111111-2222-3333-4444-555555555555";

describe("validateCopilotRequest", () => {
  it("rejects a non-object body", () => {
    expect(validateCopilotRequest(null).valid).toBe(false);
    expect(validateCopilotRequest("hello").valid).toBe(false);
    expect(validateCopilotRequest(42).valid).toBe(false);
  });

  it("rejects a missing or malformed brandId (never trusts a client-supplied non-UUID)", () => {
    expect(validateCopilotRequest({ message: "hi" }).valid).toBe(false);
    expect(validateCopilotRequest({ brandId: "not-a-uuid", message: "hi" }).valid).toBe(false);
    expect(validateCopilotRequest({ brandId: 123, message: "hi" }).valid).toBe(false);
  });

  it("rejects an empty or missing message", () => {
    expect(validateCopilotRequest({ brandId: VALID_UUID }).valid).toBe(false);
    expect(validateCopilotRequest({ brandId: VALID_UUID, message: "" }).valid).toBe(false);
    expect(validateCopilotRequest({ brandId: VALID_UUID, message: "   " }).valid).toBe(false);
  });

  it("accepts a minimal valid request and trims the message", () => {
    const result = validateCopilotRequest({ brandId: VALID_UUID, message: "  Bonjour  " });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.brandId).toBe(VALID_UUID);
      expect(result.value.message).toBe("Bonjour");
    }
  });

  it("caps an excessively long message rather than rejecting or crashing", () => {
    const longMessage = "a".repeat(10_000);
    const result = validateCopilotRequest({ brandId: VALID_UUID, message: longMessage });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.message.length).toBeLessThanOrEqual(4000);
    }
  });

  it("rejects a non-array history", () => {
    expect(validateCopilotRequest({ brandId: VALID_UUID, message: "hi", history: "not-an-array" }).valid).toBe(false);
  });

  it("silently drops malformed history entries instead of crashing", () => {
    const result = validateCopilotRequest({
      brandId: VALID_UUID,
      message: "hi",
      history: [
        { role: "user", content: "valid" },
        { role: "hacker", content: "invalid role" },
        { role: "assistant" },
        null,
        "not-an-object",
      ],
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.history).toEqual([{ role: "user", content: "valid" }]);
    }
  });

  it("caps history to at most 10 items", () => {
    const history = Array.from({ length: 25 }, (_, i) => ({ role: "user" as const, content: `msg-${i}` }));
    const result = validateCopilotRequest({ brandId: VALID_UUID, message: "hi", history });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.history?.length).toBe(10);
    }
  });
});
