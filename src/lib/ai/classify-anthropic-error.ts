import { APIConnectionError, APIConnectionTimeoutError, APIError, AuthenticationError, RateLimitError } from "@anthropic-ai/sdk";

export interface ClassifiedError {
  code: string;
  message: string;
  status: number;
}

/**
 * Classifie une erreur levée par le SDK Anthropic en un code/message/statut HTTP homogène —
 * même taxonomie que la route Atelier (F2.1), pour que les fournisseurs simulés côté client
 * réagissent de la même façon quelle que soit la route appelée. Non réutilisée par la route
 * Atelier elle-même (laissée intacte, conformément à la consigne de ne pas la modifier) —
 * réservée aux nouvelles routes.
 */
export function classifyAnthropicError(error: unknown): ClassifiedError {
  if (error instanceof RateLimitError) return { code: "quota_exceeded", message: "Quota Claude dépassé.", status: 429 };
  if (error instanceof AuthenticationError) return { code: "not_configured", message: "Clé Claude invalide.", status: 503 };
  if (error instanceof APIConnectionTimeoutError) {
    return { code: "timeout", message: "Délai d'attente Claude dépassé.", status: 504 };
  }
  if (error instanceof APIConnectionError) return { code: "provider_unavailable", message: "Service Claude injoignable.", status: 503 };
  if (error instanceof APIError) return { code: "provider_unavailable", message: "Erreur du fournisseur IA.", status: 502 };
  return { code: "unknown_error", message: "Erreur inattendue.", status: 500 };
}
