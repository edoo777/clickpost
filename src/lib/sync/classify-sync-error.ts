export interface ClassifiedSyncError {
  /** Faux = transitoire (réseau, délai, verrou momentané) — vaut la peine d'être rejoué tel
   * quel. Vrai = définitif (permission refusée, contrainte violée, colonne/table absente) —
   * rejouer la même opération produira le même échec tant que rien d'autre ne change. */
  permanent: boolean;
  message: string;
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

/**
 * Classifie une erreur de synchronisation à partir du code réellement renvoyé par Supabase —
 * jamais deviné à partir du message. Une erreur sans code reconnu est traitée comme transitoire
 * par défaut (ne bloque jamais silencieusement une opération qui pourrait encore réussir).
 */
export function classifySyncError(error: unknown): ClassifiedSyncError {
  const code = (error as { code?: string } | null | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error);

  if (code && PERMANENT_POSTGRES_CODES.has(code)) {
    return { permanent: true, message };
  }
  // Codes HTTP numériques : 4xx (hors 408 délai, 429 quota) sont généralement définitifs
  // (requête malformée, non autorisée) ; 5xx/408/429/erreurs réseau restent transitoires.
  if (code && /^4\d{2}$/.test(code) && code !== "408" && code !== "429") {
    return { permanent: true, message };
  }
  return { permanent: false, message };
}
