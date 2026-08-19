import { BadRequestError } from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { classifyAnthropicError, isInsufficientCreditError } from "@/lib/ai/classify-anthropic-error";

function buildBadRequestError(message: string): BadRequestError {
  return new BadRequestError(400, { type: "invalid_request_error", message }, message, new Headers());
}

describe("classifyAnthropicError — solde de crédit Anthropic insuffisant", () => {
  const CREDIT_MESSAGE = "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.";

  it("reconnaît le message documenté par Anthropic pour un solde de crédit insuffisant", () => {
    expect(isInsufficientCreditError(buildBadRequestError(CREDIT_MESSAGE))).toBe(true);
  });

  it("renvoie un code et un message distincts (jamais fondus dans le générique provider_unavailable)", () => {
    const classified = classifyAnthropicError(buildBadRequestError(CREDIT_MESSAGE));
    expect(classified.code).toBe("insufficient_credit");
    expect(classified.message).not.toBe("Erreur du fournisseur IA.");
    expect(classified.message.toLowerCase()).toContain("crédit");
  });

  it("ne déclenche jamais ce cas pour une autre erreur 400 (requête réellement malformée)", () => {
    const other = buildBadRequestError("model: field required");
    expect(isInsufficientCreditError(other)).toBe(false);
    const classified = classifyAnthropicError(other);
    expect(classified.code).toBe("provider_unavailable");
  });
});
