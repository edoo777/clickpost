import type { ReactNode } from "react";

/** Même style que le "eyebrow" déjà utilisé dans `BienvenueView.tsx` — extrait ici pour être
 * réutilisé par toutes les pages du site public plutôt que redéfini page par page. */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">{children}</span>;
}
