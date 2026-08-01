/**
 * Type de contenu — l'angle éditorial/marketing utilisé pour traiter une thématique (Conseil,
 * Preuve, Offre…). Concept distinct de la thématique (le sujet, ex. « Musculation ») et du
 * format (la forme, ex. « Carrousel ») — voir docs/modele-donnees.md. Ne jamais stocker une de
 * ces valeurs dans un champ thématique/theme.
 */
export type ContentType =
  | "advice"
  | "information"
  | "proof"
  | "demonstration"
  | "offer"
  | "testimonial"
  | "opinion"
  | "case_study"
  | "inspiration"
  | "objection_response";

export const ALL_CONTENT_TYPES: ContentType[] = [
  "advice",
  "information",
  "proof",
  "demonstration",
  "offer",
  "testimonial",
  "opinion",
  "case_study",
  "inspiration",
  "objection_response",
];

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  advice: "Conseil",
  information: "Information",
  proof: "Preuve",
  demonstration: "Démonstration",
  offer: "Offre",
  testimonial: "Témoignage",
  opinion: "Opinion",
  case_study: "Étude de cas",
  inspiration: "Inspiration",
  objection_response: "Réponse à une objection",
};

/** Reconnaît un libellé de type de contenu (FR, insensible à la casse/accents approximative)
 * — utilisé pour détecter côté serveur si Claude a renvoyé un type de contenu dans le mauvais
 * champ (ex. "theme": "Conseil"), jamais pour deviner silencieusement une valeur manquante. */
export function matchContentTypeLabel(value: string): ContentType | null {
  const normalized = value.trim().toLowerCase();
  const entry = Object.entries(CONTENT_TYPE_LABEL).find(([, label]) => label.toLowerCase() === normalized);
  return entry ? (entry[0] as ContentType) : null;
}

export interface ContentTypeDistribution {
  contentType: ContentType;
  count: number;
}

/** Répartition automatique équilibrée d'un total sur une liste de types de contenu choisis —
 * reste au plus 1 d'écart entre les types (les premiers reçoivent le reste de la division). */
export function buildBalancedDistribution(total: number, contentTypes: ContentType[]): ContentTypeDistribution[] {
  if (contentTypes.length === 0 || total <= 0) return [];
  const base = Math.floor(total / contentTypes.length);
  const remainder = total % contentTypes.length;
  return contentTypes.map((contentType, index) => ({
    contentType,
    count: base + (index < remainder ? 1 : 0),
  }));
}

export function sumDistribution(distribution: ContentTypeDistribution[]): number {
  return distribution.reduce((sum, entry) => sum + entry.count, 0);
}

/** Aplati une distribution en une liste ordonnée d'un type de contenu par idée à générer. */
export function expandDistribution(distribution: ContentTypeDistribution[]): ContentType[] {
  return distribution.flatMap((entry) => Array<ContentType>(Math.max(0, entry.count)).fill(entry.contentType));
}
