import { isSeedRecordId } from "@/lib/sync/seed-registry";

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
