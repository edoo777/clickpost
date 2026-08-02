/** Régions proposées pour le filtre « Pays » — mêmes codes acceptés côté serveur
 * (YouTube Data API v3, paramètre regionCode) et côté client (filtre affiché). */
export const TREND_REGIONS = [
  { code: "CA", label: "Canada" },
  { code: "US", label: "États-Unis" },
  { code: "FR", label: "France" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "MX", label: "Mexique" },
  { code: "BR", label: "Brésil" },
  { code: "AU", label: "Australie" },
] as const;

export const TREND_REGION_CODES: string[] = TREND_REGIONS.map((region) => region.code);
