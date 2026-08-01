import type { Weekday } from "@/types/editorial-calendar";

export interface Theme {
  id: string;
  brandId: string;
  label: string;
  objective: string;
  /** Description facultative de la thématique — jamais un type de contenu (Conseil, Preuve…). */
  description?: string;
  /** Mots-clés facultatifs associés à la thématique. */
  keywords?: string[];
  weekdays: Weekday[];
  order: number;
  active: boolean;
  createdAt: string;
}
