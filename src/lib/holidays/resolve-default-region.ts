import type { HolidayOption } from "@/types/holiday";

/**
 * Détermine le pays/région par défaut dans l'ordre demandé : profil utilisateur, puis marché de
 * la marque active (correspondance approximative avec le nom réel du pays, jamais une
 * supposition arbitraire), puis aucune valeur (repli sur la sélection manuelle locale).
 * Le pays du workspace n'existe pas comme champ aujourd'hui — étape ignorée, pas inventée.
 */
export function resolveDefaultCountryCode(
  profileCountry: string | null | undefined,
  brandMarket: string | null | undefined,
  supportedCountries: HolidayOption[]
): string | null {
  const normalizedProfile = profileCountry?.trim();
  if (normalizedProfile) {
    const direct = supportedCountries.find((option) => option.code.toLowerCase() === normalizedProfile.toLowerCase());
    if (direct) return direct.code;
    const byName = supportedCountries.find((option) => option.name.toLowerCase() === normalizedProfile.toLowerCase());
    if (byName) return byName.code;
  }

  const normalizedMarket = brandMarket?.trim().toLowerCase();
  if (normalizedMarket) {
    const match = supportedCountries.find(
      (option) => normalizedMarket.includes(option.name.toLowerCase()) || option.name.toLowerCase().includes(normalizedMarket)
    );
    if (match) return match.code;
  }

  return null;
}
