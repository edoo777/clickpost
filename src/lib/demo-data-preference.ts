/** Préférence d'appareil (comme le thème clair/sombre ou la barre latérale réduite) — jamais
 * synchronisée entre appareils, jamais activée par défaut. Contrôle uniquement si les données de
 * démonstration de /performances peuvent s'afficher ; sans cette activation explicite, un
 * workspace sans import CSV voit un état vide propre plutôt que des chiffres inventés. */
const STORAGE_KEY = "clickpost-demo-analytics-enabled";

export function isDemoAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function setDemoAnalyticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}
