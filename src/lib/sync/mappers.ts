function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convertit un enregistrement local (camelCase, noms de champs TypeScript) en ligne
 * Supabase (snake_case) — générique et réutilisé pour les 11 entités synchronisées,
 * les colonnes ayant été nommées exactement d'après cette conversion mécanique.
 */
export function mapRecordToRow(record: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    row[toSnakeCase(key)] = value;
  }
  return row;
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

/**
 * Inverse de `mapRecordToRow` — convertit une ligne Supabase (snake_case) en enregistrement
 * local (camelCase), pour la fusion des données distantes au démarrage (F1.6). Les colonnes
 * de métadonnées de synchronisation (`workspace_id`, `created_by`, `revision`, `deleted_at`)
 * n'ont pas d'équivalent dans la plupart des types TypeScript locaux (seul `Brand` les modélise
 * explicitement) : elles sont tout de même reportées sur l'enregistrement fusionné — des
 * propriétés supplémentaires inoffensives à l'exécution, sans changement de schéma applicatif.
 */
export function mapRowToRecord(row: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    record[toCamelCase(key)] = value;
  }
  return record;
}
