import { isSeedRecordId } from "@/lib/sync/seed-registry";

/**
 * Neutralise, dans la charge poussée vers Supabase, toute référence résiduelle à un identifiant
 * de démonstration (ex. un `themeId` ou `brandId` hérité d'un calendrier/modèle d'exemple) —
 * sans jamais rejeter l'enregistrement réel qui la porte. Une colonne UUID Supabase ne peut de
 * toute façon pas accepter un id de démonstration (ex. "theme-nova-1", format non-UUID) : la
 * référence est retirée (mise à `null`), le reste de l'enregistrement (réel) reste synchronisé
 * normalement. Ne touche jamais la colonne `id` elle-même — un enregistrement dont l'id est un
 * id de démonstration n'atteint jamais ce point (déjà exclu par `isSyncableRecordId`).
 */
export function stripSeedReferences(row: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = key !== "id" && typeof value === "string" && isSeedRecordId(value) ? null : value;
  }
  return sanitized;
}

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Vrai si l'id correspond au format généré par `crypto.randomUUID()` — utilisé
 * par toute création réelle dans l'application (12 points de création vérifiés).
 * Filet de sécurité secondaire uniquement : ne sert plus, seul, à décider si un
 * enregistrement doit être synchronisé (voir `isSyncableRecordId`).
 */
export function isUuidV4(id: string): boolean {
  return UUID_V4_PATTERN.test(id);
}

/**
 * Décision de synchronisation, basée sur le registre explicite des identifiants
 * seed (`seed-registry.ts`) — jamais uniquement sur le format de l'id. Un
 * enregistrement est synchronisable sauf s'il figure explicitement dans le
 * registre des données de démonstration : une vraie donnée utilisateur n'est
 * donc jamais exclue à cause de la forme de son identifiant.
 */
export function isSyncableRecordId(id: string): boolean {
  return !isSeedRecordId(id);
}
