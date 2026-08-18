"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "@/lib/i18n/dictionaries/en";
import fr, { type Dictionary } from "@/lib/i18n/dictionaries/fr";
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/locale";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };

// Chemins pointés type-sûrs ("nav.dashboard", "common.save"...) dérivés directement de la forme
// du dictionnaire français — une clé qui n'existe pas (ou une faute de frappe) est une erreur de
// compilation, jamais une chaîne manquante découverte seulement à l'exécution.
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : DotPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
export type TranslationKey = DotPaths<Dictionary>;

function resolve(dictionary: Dictionary, key: string): string {
  const parts = key.split(".");
  let value: unknown = dictionary;
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}

interface LocaleContextValue {
  locale: Locale;
  /** Change la langue de l'interface immédiatement (contexte + cookie + localStorage) — la
   * synchronisation avec `profiles.ui_locale` (utilisateur authentifié) est à la charge de
   * l'appelant, voir LanguageSwitcher.tsx, pour ne jamais coupler ce module au client Supabase. */
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`));
  const fromCookie = match ? decodeURIComponent(match[1]) : null;
  if (isSupportedLocale(fromCookie)) return fromCookie;
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(fromStorage)) return fromStorage;
  } catch {
    // localStorage indisponible (navigation privée stricte...) — repli silencieux sur le défaut.
  }
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Non bloquant : le cookie ci-dessous suffit à faire persister le choix.
  }
  // 1 an, disponible sur tout le site — jamais de donnée sensible, une simple préférence UI.
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

/**
 * Fournisseur i18n centralisé — monté à la racine (voir src/app/layout.tsx), disponible partout.
 * `initialLocale` doit être lu côté serveur (cookie, voir src/app/layout.tsx via `next/headers`)
 * et transmis ici pour que le tout premier rendu (HTML envoyé par le serveur, avant hydratation)
 * soit déjà dans la bonne langue — sans ce prop, un visiteur anglophone verrait toujours un flash
 * de contenu français avant la correction côté client. Le repli cookie/localStorage côté client
 * ne sert plus qu'aux rendus purement client (ex. un `<LocaleProvider>` de test sans wrapper
 * serveur) et à rattraper un cookie posé après le chargement initial (rare).
 */
export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  useEffect(() => {
    if (initialLocale) return;
    // Appel différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect,
    // même motif que workspace-provider.tsx) — ne s'exécute qu'au montage, uniquement quand aucun
    // `initialLocale` côté serveur n'a été fourni (repli client pur, ex. tests).
    const timeout = setTimeout(() => setLocaleState(readInitialLocale()), 0);
    return () => clearTimeout(timeout);
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const dictionary = DICTIONARIES[locale];
  const t = useCallback((key: TranslationKey) => resolve(dictionary, key), [dictionary]);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}

/** Alias explicite pour les composants qui n'ont besoin que de `t()`. */
export function useTranslations() {
  return useLocale().t;
}
