import { APIConnectionError, APIConnectionTimeoutError, APIError, AuthenticationError, BadRequestError, RateLimitError } from "@anthropic-ai/sdk";

export interface ClassifiedError {
  code: string;
  message: string;
  status: number;
}

/** Détecte le cas précis "solde de crédit Anthropic insuffisant" (400 invalid_request_error,
 * message documenté par Anthropic) — un blocage de facturation externe, jamais transitoire,
 * jamais résolu par une nouvelle tentative : mérite un message explicite plutôt que de se fondre
 * dans le générique "Erreur du fournisseur IA" (502), qui laisserait croire à un simple incident
 * réseau côté Claude. Correspondance sur le texte du message plutôt qu'un code dédié : Anthropic
 * ne distingue pas ce cas par un type d'erreur séparé côté SDK à ce jour. */
export function isInsufficientCreditError(error: BadRequestError): boolean {
  return /credit balance is too low/i.test(error.message);
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
  if (error instanceof BadRequestError && isInsufficientCreditError(error)) {
    return {
      code: "insufficient_credit",
      message: "Le compte Anthropic (Claude) n'a plus de crédit disponible — la génération IA est temporairement indisponible, indépendamment de votre demande. Contactez l'administrateur ClickPost.",
      status: 503,
    };
  }
  if (error instanceof APIConnectionTimeoutError) {
    return { code: "timeout", message: "Délai d'attente Claude dépassé.", status: 504 };
  }
  if (error instanceof APIConnectionError) return { code: "provider_unavailable", message: "Service Claude injoignable.", status: 503 };
  if (error instanceof APIError) return { code: "provider_unavailable", message: "Erreur du fournisseur IA.", status: 502 };
  return { code: "unknown_error", message: "Erreur inattendue.", status: 500 };
}
