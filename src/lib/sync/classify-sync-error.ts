export interface ClassifiedSyncError {
  /** Faux = transitoire (réseau, délai, verrou momentané, annulation) — vaut la peine d'être
   * rejoué tel quel, catégorie « attendue et déjà gérée ». Vrai = définitif (permission refusée,
   * contrainte violée, colonne/table absente) — rejouer la même opération produira le même échec
   * tant que rien d'autre ne change, catégorie « inattendue ou persistante ». */
  permanent: boolean;
  message: string;
  /** Vrai pour un refus RLS (code Postgres 42501) — distinct des autres erreurs permanentes pour
   * un message dédié, jamais contourné en élargissant une politique RLS depuis le client. */
  isPermissionError: boolean;
}

/** Contexte de l'opération qui a échoué — jamais de donnée sensible (le contenu de
 * l'enregistrement n'est jamais journalisé, seulement son identifiant et sa nature). */
export interface SyncErrorContext {
  operation: string;
  entityType: string;
  recordId: string;
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
const FALLBACK_MESSAGE = "Une opération de synchronisation a échoué sans détail exploitable.";

function hasOwnUsableString(error: object, key: string): boolean {
  if (!(key in error)) return false;
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Extrait un message compréhensible depuis n'importe quelle forme d'erreur réellement rencontrée
 * ici : une vraie instance `Error`, un objet d'erreur Supabase/PostgREST (`{ message, details,
 * hint, code }` — un objet simple, PAS une instance d'`Error`), une `Response` HTTP, une chaîne,
 * un objet vide (aucune information exploitable), `null`/`undefined`, ou tout autre cas imprévu.
 * `String(error)` sur un objet simple produit littéralement "[object Object]" — jamais utilisé
 * ici pour cette raison ; un objet sans clé exploitable renvoie un message interne clair plutôt
 * que "{}" ou "undefined".
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || FALLBACK_MESSAGE;
  if (typeof Response !== "undefined" && error instanceof Response) {
    return `Réponse HTTP invalide (${error.status}${error.statusText ? ` ${error.statusText}` : ""}).`;
  }
  if (typeof error === "string") return error.trim().length > 0 ? error : FALLBACK_MESSAGE;
  if (error === null || error === undefined) return FALLBACK_MESSAGE;
  if (typeof error === "object") {
    if (hasOwnUsableString(error, "message")) return (error as { message: string }).message;
    if (hasOwnUsableString(error, "details")) return (error as { details: string }).details;
    if (hasOwnUsableString(error, "hint")) return (error as { hint: string }).hint;
    // Objet sans aucune clé exploitable (ex. `{}`, ou un objet dont toutes les propriétés sont
    // vides) — jamais affiché tel quel, jamais "{}" ni "[object Object]".
    return FALLBACK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}

function extractCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.trim().length > 0) return code;
  }
  return undefined;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof Error) return error.name === "AbortError";
  return Boolean(error && typeof error === "object" && (error as { name?: unknown }).name === "AbortError");
}

/** Journalise le détail technique complet (contexte de l'opération, code, message) — jamais de
 * contenu d'enregistrement, jamais de secret/jeton/clé. Sévérité choisie selon la classification
 * déjà déterminée : `console.warn` pour une erreur transitoire/attendue (catégorie A — hors
 * ligne, délai, annulation, verrou momentané, sera rejouée automatiquement), qui ne doit jamais
 * déclencher l'overlay d'erreur de Next.js en développement ; `console.error` réservé aux erreurs
 * définitives/inattendues (catégorie B — permission refusée, schéma incompatible, contrainte
 * violée), qui méritent réellement l'attention immédiate d'un développeur. Silencieux en
 * production dans les deux cas. */
function logTechnicalDetail(error: unknown, classified: ClassifiedSyncError, context?: SyncErrorContext) {
  if (process.env.NODE_ENV === "production") return;
  const detail = {
    context: context ?? "contexte inconnu",
    code: extractCode(error),
    message: classified.message,
    permanent: classified.permanent,
  };
  if (classified.permanent) {
    console.error("[sync] erreur de synchronisation persistante", detail);
  } else {
    console.warn("[sync] erreur de synchronisation transitoire (nouvelle tentative automatique)", detail);
  }
}

/**
 * Classifie une erreur de synchronisation à partir du code réellement renvoyé par Supabase —
 * jamais deviné à partir du message. Une erreur sans code reconnu est traitée comme transitoire
 * par défaut (ne bloque jamais silencieusement une opération qui pourrait encore réussir).
 * `context` (opération/entité/identifiant concernés) est ajouté au log de développement
 * uniquement — jamais transmis à l'utilisateur, jamais de donnée sensible.
 */
export function classifySyncError(error: unknown, context?: SyncErrorContext): ClassifiedSyncError {
  const code = extractCode(error);
  const isPermissionError = code === PERMISSION_DENIED_CODE;

  let classified: ClassifiedSyncError;
  if (isPermissionError) {
    classified = {
      permanent: true,
      isPermissionError: true,
      message: "Vous n'avez pas la permission nécessaire pour cette action dans ce workspace.",
    };
  } else if (isAbortError(error)) {
    // Annulation (navigation, démontage de composant, nouvelle tentative explicite qui remplace
    // celle-ci) — jamais un échec réel, toujours transitoire, jamais affiché comme une erreur.
    classified = { permanent: false, isPermissionError: false, message: "Opération annulée — nouvelle tentative automatique." };
  } else {
    const message = extractErrorMessage(error);
    const isKnownPermanentCode = Boolean(code && PERMANENT_POSTGRES_CODES.has(code));
    // Codes HTTP numériques : 4xx (hors 408 délai, 429 quota) sont généralement définitifs
    // (requête malformée, non autorisée) ; 5xx/408/429/erreurs réseau restent transitoires.
    const isPermanentHttpCode = Boolean(code && /^4\d{2}$/.test(code) && code !== "408" && code !== "429");
    classified = { permanent: isKnownPermanentCode || isPermanentHttpCode, isPermissionError: false, message };
  }

  logTechnicalDetail(error, classified, context);
  return classified;
}
