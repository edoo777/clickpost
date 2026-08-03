import type { ContentBlock, WebSearchToolResultErrorCode } from "@anthropic-ai/sdk/resources/messages";

/**
 * Classifie les erreurs "en bande" du web_search server tool Anthropic — distinctes des
 * exceptions du SDK (voir lib/ai/classify-anthropic-error.ts, non modifié) : le tool renvoie un
 * statut HTTP 200 même en cas d'échec de recherche, l'erreur apparaît dans un bloc
 * `web_search_tool_result` de type `web_search_tool_result_error`. Documenté officiellement :
 * too_many_requests, invalid_tool_input, max_uses_exceeded, query_too_long, request_too_large,
 * unavailable.
 */

export interface ClassifiedWebSearchError {
  code: string;
  message: string;
}

export function classifyWebSearchToolError(errorCode: WebSearchToolResultErrorCode): ClassifiedWebSearchError {
  switch (errorCode) {
    case "too_many_requests":
      return { code: "provider_rate_limited", message: "Le fournisseur de recherche Web est temporairement limité — réessayez dans un instant." };
    case "max_uses_exceeded":
      return { code: "max_uses_exceeded", message: "Nombre maximal de recherches atteint pour cette requête." };
    case "query_too_long":
      return { code: "invalid_query", message: "Requête de recherche trop longue." };
    case "invalid_tool_input":
      return { code: "invalid_query", message: "Requête de recherche invalide." };
    case "request_too_large":
      return { code: "request_too_large", message: "Requête de recherche trop volumineuse." };
    case "unavailable":
    default:
      return { code: "provider_unavailable", message: "Le service de recherche Web est temporairement indisponible." };
  }
}

/** Repère un éventuel bloc d'erreur de recherche parmi les blocs de contenu de la réponse
 * Anthropic — renvoie le premier trouvé (une requête peut enchaîner plusieurs recherches ;
 * une seule en erreur suffit à documenter honnêtement l'échec partiel). */
export function findWebSearchToolError(content: ContentBlock[]): ClassifiedWebSearchError | null {
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
    if (Array.isArray(block.content)) continue; // liste de résultats, pas une erreur.
    return classifyWebSearchToolError(block.content.error_code);
  }
  return null;
}
