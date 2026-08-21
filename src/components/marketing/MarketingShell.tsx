import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

/** Ossature commune à toutes les pages du site public (en-tête collant + pied de page) — jamais
 * utilisée dans le groupe `(dashboard)` authentifié, qui garde son propre chrome. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <MarketingHeader />
      <main className="flex flex-col overflow-x-hidden">{children}</main>
      <MarketingFooter />
    </div>
  );
}
