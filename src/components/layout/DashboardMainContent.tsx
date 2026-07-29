"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * L'Atelier de contenu est un espace de travail plein écran (Notion/OneNote), pas une page de
 * formulaire classique : il a besoin de toute la largeur disponible, sans la colonne centrée
 * max-w-6xl utilisée par le reste du tableau de bord. Toutes les autres routes gardent le
 * comportement existant à l'identique.
 */
export function DashboardMainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWorkshop = pathname?.startsWith("/atelier/") ?? false;

  if (isWorkshop) {
    return (
      <main className="dashboard-main flex-1 overflow-y-auto transition-[margin] duration-[250ms] ease-in-out motion-reduce:transition-none lg:ml-[var(--sidebar-w)]">
        {children}
      </main>
    );
  }

  return (
    <main className="dashboard-main flex-1 overflow-y-auto px-4 py-6 transition-[margin] duration-[250ms] ease-in-out motion-reduce:transition-none sm:px-6 lg:ml-[var(--sidebar-w)] lg:px-10 lg:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
    </main>
  );
}
