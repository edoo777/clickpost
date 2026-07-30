import type { SyncEntityType } from "@/lib/sync/types";

/** Libellés génériques par type d'entité (F1.7) — une seule source, réutilisée par la liste,
 * les filtres et la comparaison, plutôt qu'une interface dupliquée par table. */
export const CONFLICT_ENTITY_LABEL: Record<SyncEntityType, string> = {
  accounts: "Compte social",
  brands: "Marque",
  campaigns: "Campagne",
  themes: "Thématique",
  topicBatches: "Bloc de sujets",
  topics: "Sujet",
  ideas: "Idée",
  contentVersions: "Version de contenu",
  workflowStages: "Étape de workflow",
  savedViews: "Vue enregistrée",
  posts: "Publication",
};

const TITLE_FIELD_BY_ENTITY: Partial<Record<SyncEntityType, string>> = {
  accounts: "accountName",
  brands: "name",
  campaigns: "name",
  themes: "label",
  topicBatches: "name",
  topics: "label",
  ideas: "title",
  contentVersions: "name",
  workflowStages: "name",
  savedViews: "name",
  posts: "excerpt",
};

function readStringField(record: Record<string, unknown> | null | undefined, field: string): string | undefined {
  const value = record?.[field];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/** Titre affiché pour un enregistrement en conflit, quel que soit son type — préfère la
 * version locale (plus probablement à jour dans l'esprit de l'utilisateur), puis la distante. */
export function getConflictTitle(
  entityType: SyncEntityType,
  local: Record<string, unknown> | null,
  remote: Record<string, unknown>
): string {
  const field = TITLE_FIELD_BY_ENTITY[entityType];
  if (!field) return "Sans titre";
  return readStringField(local, field) ?? readStringField(remote, field) ?? "Sans titre";
}

/** Identifiant de marque associé, quand le type d'entité en porte un (brandId direct, ou nom
 * de marque en texte libre pour les comptes/publications, plus anciens dans le modèle). */
export function getConflictBrandRef(
  local: Record<string, unknown> | null,
  remote: Record<string, unknown>
): { brandId?: string; brandName?: string } {
  const brandId = readStringField(local, "brandId") ?? readStringField(remote, "brandId");
  const brandName = readStringField(local, "brand") ?? readStringField(remote, "brand");
  return { brandId, brandName };
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  return String(value);
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Champs de métadonnées techniques, affichés à part (section "Métadonnées") plutôt que mêlés
// aux champs métier dans la comparaison champ par champ.
export const CONFLICT_METADATA_FIELDS = ["createdAt", "updatedAt", "revision"] as const;

// Champs jamais utiles à comparer dans la vue générique (identité, propriétaire, suppression).
const HIDDEN_DIFF_FIELDS = new Set([
  "id",
  "workspaceId",
  "createdBy",
  "deletedAt",
  ...CONFLICT_METADATA_FIELDS,
]);

export interface ConflictFieldRow {
  key: string;
  localValue: unknown;
  remoteValue: unknown;
  isDifferent: boolean;
}

/** Diff générique clé/valeur entre les deux versions — fonctionne pour les 11 types d'entités
 * sans logique métier spécifique, les champs différents étant simplement mis en avant. */
export function buildConflictFieldRows(
  local: Record<string, unknown> | null,
  remote: Record<string, unknown>
): ConflictFieldRow[] {
  const keys = new Set<string>([...(local ? Object.keys(local) : []), ...Object.keys(remote)]);
  const rows: ConflictFieldRow[] = [];
  for (const key of keys) {
    if (HIDDEN_DIFF_FIELDS.has(key)) continue;
    const localValue = local ? local[key] : undefined;
    const remoteValue = remote[key];
    const isDifferent = JSON.stringify(localValue) !== JSON.stringify(remoteValue);
    rows.push({ key, localValue, remoteValue, isDifferent });
  }
  return rows.sort((a, b) => Number(b.isDifferent) - Number(a.isDifferent) || a.key.localeCompare(b.key));
}
