import type { ImportedMetricRecord, MetricValues } from "@/types/analytics";
import type { Publication } from "@/types/publication";

/** Colonnes de métriques attendues dans un CSV importé — dans cet ordre exact pour le modèle
 * généré, mais l'analyse (parseMetricsCsv) accepte les colonnes dans n'importe quel ordre par
 * en-tête. */
const METRIC_COLUMNS: (keyof MetricValues)[] = [
  "impressions",
  "reach",
  "views",
  "interactions",
  "reactions",
  "comments",
  "shares",
  "saves",
  "clicks",
  "newFollowers",
  "conversions",
];

const METRIC_COLUMN_LABEL: Record<keyof MetricValues, string> = {
  impressions: "impressions",
  reach: "portee",
  views: "vues",
  interactions: "interactions",
  reactions: "reactions",
  comments: "commentaires",
  shares: "partages",
  saves: "sauvegardes",
  clicks: "clics",
  newFollowers: "nouveaux_abonnes",
  conversions: "conversions",
};

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Génère un CSV pré-rempli (identifiant, titre, plateforme, date — colonnes de repère en lecture
 * seule) avec les colonnes de métriques vides, prêt à être complété avec de vraies valeurs issues
 * des tableaux de bord natifs des plateformes, puis réimporté. Ne jamais deviner de valeurs. */
export function buildMetricsCsvTemplate(publications: Publication[]): string {
  const header = ["publication_id", "titre", "plateforme", "date_programmee", ...METRIC_COLUMNS.map((key) => METRIC_COLUMN_LABEL[key])];
  const rows = publications.map((publication) => [
    publication.id,
    csvEscape(publication.excerpt || "Sans titre"),
    publication.platform,
    publication.scheduledFor.slice(0, 10),
    ...METRIC_COLUMNS.map(() => ""),
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

export interface ParsedMetricsCsvResult {
  records: Omit<ImportedMetricRecord, "id" | "importedAt" | "importedBy" | "sourceFileName">[];
  errors: string[];
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

/** N'accepte que des lignes rattachées à un `publication_id` réel et connu (fourni en paramètre)
 * — jamais de correspondance approximative par titre, qui pourrait silencieusement attribuer des
 * chiffres à la mauvaise publication. Une ligne sans identifiant reconnu est rejetée avec un
 * message explicite plutôt qu'ignorée silencieusement. */
export function parseMetricsCsv(text: string, knownPublicationIds: Set<string>): ParsedMetricsCsvResult {
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { records: [], errors: ["Fichier vide."] };

  const header = parseCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const publicationIdIndex = header.indexOf("publication_id");
  if (publicationIdIndex === -1) {
    return { records: [], errors: ['Colonne "publication_id" introuvable — utilisez le modèle fourni.'] };
  }

  const metricIndexes = METRIC_COLUMNS.map((key) => ({ key, index: header.indexOf(METRIC_COLUMN_LABEL[key]) }));

  const records: ParsedMetricsCsvResult["records"] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cells = parseCsvLine(lines[lineIndex]);
    const publicationId = cells[publicationIdIndex]?.trim();
    if (!publicationId) {
      errors.push(`Ligne ${lineIndex + 1} : identifiant de publication manquant, ignorée.`);
      continue;
    }
    if (!knownPublicationIds.has(publicationId)) {
      errors.push(`Ligne ${lineIndex + 1} : identifiant "${publicationId}" ne correspond à aucune publication de ce workspace, ignorée.`);
      continue;
    }

    const values = {} as MetricValues;
    let hasInvalidNumber = false;
    for (const { key, index } of metricIndexes) {
      const raw = index >= 0 ? cells[index]?.trim() : "";
      if (!raw) {
        values[key] = 0;
        continue;
      }
      const parsed = Number(raw.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push(`Ligne ${lineIndex + 1} : valeur invalide pour "${METRIC_COLUMN_LABEL[key]}" ("${raw}"), ligne ignorée.`);
        hasInvalidNumber = true;
        break;
      }
      values[key] = Math.round(parsed);
    }
    if (hasInvalidNumber) continue;

    records.push({ publicationId, ...values });
  }

  return { records, errors };
}

/** Export CSV réel du rapport actuellement affiché — les seules données exportées sont celles
 * déjà visibles à l'écran (mêmes filtres), jamais recalculées séparément. */
export function buildReportExportCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return "";
  const header = Object.keys(rows[0]);
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => csvEscape(String(row[key] ?? ""))).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
