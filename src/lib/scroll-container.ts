/** Le contenu défile dans `<main class="dashboard-main">` (`overflow-y-auto`), jamais dans la
 * fenêtre elle-même (voir DashboardMainContent.tsx) — toute sauvegarde/restauration de position
 * de défilement doit cibler ce conteneur, pas `window`. */
export function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector(".dashboard-main");
}

export function getScrollTop(): number {
  return getScrollContainer()?.scrollTop ?? 0;
}

export function restoreScrollTop(value: number) {
  getScrollContainer()?.scrollTo(0, value);
}
