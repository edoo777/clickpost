"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "clickpost-theme";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : "system";
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

/**
 * Un seul abonnement couvre les deux sources externes pertinentes : les changements de préférence
 * système (utiles quand le thème actif est "system") et les écritures dans localStorage (même
 * onglet via `notifyListeners`, autres onglets via l'évènement natif "storage").
 */
function subscribe(callback: Listener) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): Theme {
  return readStoredTheme();
}

function getThemeServerSnapshot(): Theme {
  return "system";
}

function getResolvedSnapshot(): ResolvedTheme {
  return resolveTheme(readStoredTheme());
}

function getResolvedServerSnapshot(): ResolvedTheme {
  return "light";
}

/** Source de vérité unique pour le thème : écrit dans localStorage puis notifie tous les abonnés. */
export function setTheme(next: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  notifyListeners();
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * `useSyncExternalStore` fournit un instantané compatible SSR/hydratation par construction
 * (getServerSnapshot = "system"/"light", identique à ce que rend le serveur), sans mismatch
 * d'hydratation ni `setState` manuel dans un effet. Le script anti-flash du layout racine a déjà
 * posé la bonne classe `.dark` avant même ce montage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeServerSnapshot);
  const resolvedTheme = useSyncExternalStore(subscribe, getResolvedSnapshot, getResolvedServerSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value: ThemeContextValue = { theme, resolvedTheme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
