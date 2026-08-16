import type { ReportKpiSnapshot } from "@/types/report";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SNAPSHOT_JSON_LENGTH = 30_000;

export interface RapportsGenerateRequestInput {
  brandId: string;
  snapshot: ReportKpiSnapshot;
}

export type RapportsGenerateRequestValidation =
  | { valid: true; value: RapportsGenerateRequestInput }
  | { valid: false; message: string };

/**
 * Validation structurelle du payload — le détail des champs numériques n'est pas revérifié
 * exhaustivement (le payload vient de build-report-data.ts, un calcul de confiance côté client),
 * mais la forme générale, les types énumérés et la taille totale le sont, pour ne jamais envoyer
 * un objet malformé ou disproportionné à Claude.
 */
export function validateRapportsGenerateRequest(body: unknown): RapportsGenerateRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { valid: false, message: "Corps de requête invalide." };
  }
  const record = body as Record<string, unknown>;

  const brandId = record.brandId;
  if (typeof brandId !== "string" || !UUID_PATTERN.test(brandId)) {
    return { valid: false, message: "Identifiant de marque invalide." };
  }

  const snapshot = record.snapshot;
  if (typeof snapshot !== "object" || snapshot === null) {
    return { valid: false, message: "Données de rapport invalides." };
  }
  const snapshotRecord = snapshot as Record<string, unknown>;

  if (
    snapshotRecord.reportType !== "internal" &&
    snapshotRecord.reportType !== "client" &&
    snapshotRecord.reportType !== "executive"
  ) {
    return { valid: false, message: "Type de rapport invalide." };
  }

  const periodStart = snapshotRecord.periodStart;
  const periodEnd = snapshotRecord.periodEnd;
  if (typeof periodStart !== "string" || !DATE_PATTERN.test(periodStart)) {
    return { valid: false, message: "Date de début invalide." };
  }
  if (typeof periodEnd !== "string" || !DATE_PATTERN.test(periodEnd)) {
    return { valid: false, message: "Date de fin invalide." };
  }

  if (!Array.isArray(snapshotRecord.platforms) || !snapshotRecord.platforms.every((p) => typeof p === "string")) {
    return { valid: false, message: "Liste de plateformes invalide." };
  }

  if (typeof snapshotRecord.workDone !== "object" || snapshotRecord.workDone === null) {
    return { valid: false, message: "Données de travail réalisé invalides." };
  }
  if (typeof snapshotRecord.contentProduction !== "object" || snapshotRecord.contentProduction === null) {
    return { valid: false, message: "Données de production invalides." };
  }
  if (typeof snapshotRecord.performance !== "object" || snapshotRecord.performance === null) {
    return { valid: false, message: "Données de performance invalides." };
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(snapshot);
  } catch {
    return { valid: false, message: "Données de rapport invalides." };
  }
  if (serialized.length > MAX_SNAPSHOT_JSON_LENGTH) {
    return { valid: false, message: "Données de rapport trop volumineuses." };
  }

  return { valid: true, value: { brandId, snapshot: snapshot as ReportKpiSnapshot } };
}
