function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convertit un enregistrement local (camelCase, noms de champs TypeScript) en ligne
 * Supabase (snake_case) — générique et réutilisé pour les 10 entités synchronisées,
 * les colonnes ayant été nommées exactement d'après cette conversion mécanique.
 */
export function mapRecordToRow(record: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    row[toSnakeCase(key)] = value;
  }
  return row;
}
