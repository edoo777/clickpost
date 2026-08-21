import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outlineLight" | "inverse";
type Size = "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25 hover:from-violet-500 hover:to-fuchsia-500",
  secondary: "border border-border bg-surface text-foreground hover:bg-muted",
  ghost: "text-foreground/90 hover:text-foreground",
  /** Réservé aux fonds sombres hors thème (ex. la section CTA finale) — jamais combiné avec les
   * classes des autres variantes, pour ne jamais dépendre de l'ordre de génération Tailwind. */
  outlineLight: "border border-white/20 bg-white/5 text-white hover:bg-white/10",
  /** Bouton blanc plein — réservé à l'intérieur d'une carte à fond dégradé violet/fuchsia (ex. le
   * plan tarifaire recommandé), jamais combiné avec les classes des autres variantes. */
  inverse: "bg-white text-violet-700 hover:bg-white/90",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm sm:text-base",
};

interface MarketingButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  icon?: ReactNode;
}

/** Bouton d'appel à l'action réutilisé sur toutes les pages du site public — mêmes classes
 * exactes que les CTA déjà utilisés dans `BienvenueView.tsx`/`AuthShell.tsx`
 * (`from-violet-600 to-fuchsia-600`), jamais un nouveau style introduit. */
export function MarketingButton({ href, children, variant = "primary", size = "md", className = "", icon }: MarketingButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    >
      {children}
      {icon}
    </Link>
  );
}
