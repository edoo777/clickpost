const COUNTRY_PATTERN = /^[A-Za-z]{2}$/;
const REGION_PATTERN = /^[A-Za-z0-9-]{1,10}$/;
const LOCALE_PATTERN = /^[a-z]{2}$/;
const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

export interface ValidatedHolidaysRequest {
  countryCode: string;
  regionCode?: string;
  year: number;
  locale: string;
}

export type HolidaysRequestValidation = { valid: true; value: ValidatedHolidaysRequest } | { valid: false; message: string };

export function validateHolidaysRequest(params: URLSearchParams): HolidaysRequestValidation {
  const countryRaw = params.get("countryCode");
  if (!countryRaw || !COUNTRY_PATTERN.test(countryRaw)) {
    return { valid: false, message: "Code pays invalide (2 lettres attendues)." };
  }

  const regionRaw = params.get("regionCode");
  if (regionRaw && !REGION_PATTERN.test(regionRaw)) {
    return { valid: false, message: "Code région invalide." };
  }

  const yearRaw = params.get("year");
  const year = yearRaw ? Number(yearRaw) : NaN;
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return { valid: false, message: "Année invalide." };
  }

  const localeRaw = params.get("locale") ?? "fr";
  if (!LOCALE_PATTERN.test(localeRaw)) {
    return { valid: false, message: "Langue invalide." };
  }

  return {
    valid: true,
    value: {
      countryCode: countryRaw.toUpperCase(),
      regionCode: regionRaw ? regionRaw.toUpperCase() : undefined,
      year,
      locale: localeRaw.toLowerCase(),
    },
  };
}
