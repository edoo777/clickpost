export interface ClassifiedSyncError {
  /** Faux = transitoire (réseau, délai, verrou momentané) — vaut la peine d'être rejoué tel
   * quel. Vrai = définitif (permission refusée, contrainte violée, colonne/table absente) —
   * rejouer la même opération produira le même échec tant que rien d'autre ne change. */
  permanent: boolean;
  message: string;
  /** Vrai pour un refus RLS (code Postgres 42501) — distinct des autres erreurs permanentes pour
   * un message dédié, jamais contourné en élargissant une politique RLS depuis le client. */
  isPermissionError: boolean;
}

/** Codes Postgres/PostgREST qui ne peuvent jamais réussir par simple nouvelle tentative — la
 * ligne, la contrainte ou le schéma en cause ne changent pas entre deux essais identiques. */
const PERMANENT_POSTGRES_CODES = new Set([
  "42501", // permission denied (RLS)
  "42703", // colonne inexistante
  "42P01", // table inexistante
  "23503", // violation de clé étrangère
  "23502", // violation NOT NULL
  "23514", // violation de contrainte CHECK
  "22P02", // représentation invalide (type de donnée incompatible)
]);

const PERMISSION_DENIED_CODE = "42501";

/**
 * Extrait un message compréhensible depuis n'importe quelle forme d'erreur réellement rencontrée
 * ici : une vraie instance `Error`, un objet d'erreur Supabase/PostgREST (`{ message, details,
 * hint, code }` — un objet simple, PAS une instance d'`Error`), une chaîne, ou tout autre cas
 * imprévu. `String(error)` sur un objet simple produit littéralement "[object Object]" — jamais
 * utilisé ici pour cette raison.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "Erreur inconnue.";
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) return message;
  }
  return "Erreur de synchronisation inconnue.";
}

/** Journalise le détail technique complet (code, message, hint) uniquement en développement —
 * jamais en production, jamais de donnée utilisateur au-delà de ce que Supabase renvoie déjà
 * dans son propre message d'erreur. */
function logTechnicalDetail(error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.error("[sync] erreur technique", error);
}

/**
 * Classifie une erreur de synchronisation à partir du code réellement renvoyé par Supabase —
 * jamais deviné à partir du message. Une erreur sans code reconnu est traitée comme transitoire
 * par défaut (ne bloque jamais silencieusement une opération qui pourrait encore réussir).
 */
export function classifySyncError(error: unknown): ClassifiedSyncError {
  logTechnicalDetail(error);

  const code = (error as { code?: string } | null | undefined)?.code;
  const isPermissionError = code === PERMISSION_DENIED_CODE;

  if (isPermissionError) {
    return {
      permanent: true,
      isPermissionError: true,
      message: "Vous n'avez pas la permission nécessaire pour cette action dans ce workspace.",
    };
  }

  const message = extractErrorMessage(error);

  if (code && PERMANENT_POSTGRES_CODES.has(code)) {
    return { permanent: true, isPermissionError: false, message };
  }
  // Codes HTTP numériques : 4xx (hors 408 délai, 429 quota) sont généralement définitifs
  // (requête malformée, non autorisée) ; 5xx/408/429/erreurs réseau restent transitoires.
  if (code && /^4\d{2}$/.test(code) && code !== "408" && code !== "429") {
    return { permanent: true, isPermissionError: false, message };
  }
  return { permanent: false, isPermissionError: false, message };
}
