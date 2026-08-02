/**
 * Concept distinct d'une thématique/campagne éditoriale : une date ou une période à surveiller
 * lors de la planification (congé, événement annuel, événement d'organisation, campagne de
 * marque) — jamais transformée automatiquement en publication.
 */
export type ImportantDateCategory = "holiday" | "annual_event" | "organization" | "brand_campaign";

export type ImportantDateStatus = "active" | "archived";

export interface ImportantDate {
  id: string;
  workspaceId: string;
  category: ImportantDateCategory;
  title: string;
  description?: string;
  /** AAAA-MM-JJ */
  startDate: string;
  /** AAAA-MM-JJ — optionnel, pour une période (ex. campagne multi-jours). */
  endDate?: string;
  /** Pertinent uniquement pour category "holiday" (code pays, ex. "CA"). */
  country?: string;
  /** Région/province facultative, affine `country` (ex. "QC"). */
  region?: string;
  /** Pertinent uniquement pour category "brand_campaign". */
  brandId?: string;
  /** "manual" = saisi par un utilisateur ; "external" réservé à un futur import de jours fériés
   * (non actif) — jamais une date fériée inventée par défaut. */
  source: "manual" | "external";
  externalId?: string;
  status: ImportantDateStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
