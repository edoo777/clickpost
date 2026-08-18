/**
 * Types/constantes sûrs côté client — jamais de dépendance serveur ici (voir locale-provider.tsx
 * pour le contexte React, dictionaries/ pour le contenu traduit). Architecture i18n centralisée :
 * aucune chaîne FR/EN ne doit être écrite en dur dispersée dans les composants — tout passe par
 * `t()` (voir locale-provider.tsx) et les dictionnaires ci-dessous.
 */
export type Locale = "fr" | "en";

export const DEFAULT_LOCALE: Locale = "fr";
export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];

export const LOCALE_STORAGE_KEY = "clickpost-locale";
export const LOCALE_COOKIE_NAME = "clickpost-locale";

export function isSupportedLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en";
}

export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};
