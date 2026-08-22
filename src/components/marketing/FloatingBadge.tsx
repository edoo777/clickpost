import type { ReactNode } from "react";

type Position = "top-left" | "top-right" | "mid-left" | "mid-right" | "bottom-left" | "bottom-right" | "bottom-center";
type Tone = "default" | "success" | "accent";

const POSITION_CLASS: Record<Position, string> = {
  "top-left": "-left-4 top-6 sm:-left-8",
  "top-right": "-right-4 top-2 sm:-right-10",
  "mid-left": "-left-6 top-1/2 -translate-y-1/2 sm:-left-12",
  "mid-right": "-right-6 top-1/3 sm:-right-12",
  "bottom-left": "-left-4 bottom-10 sm:-left-10",
  "bottom-right": "-right-4 bottom-4 sm:-right-8",
  "bottom-center": "-bottom-5 left-1/2 -translate-x-1/2",
};

const TONE_CLASS: Record<Tone, string> = {
  default: "border-border bg-surface text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
  accent: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
};

const FLOAT_CLASS = ["marketing-float", "marketing-float-delay", "marketing-float-slow"];

interface FloatingBadgeProps {
  icon: ReactNode;
  children: ReactNode;
  position: Position;
  tone?: Tone;
  /** Index utilisé pour faire varier légèrement le rythme de flottement entre badges voisins —
   * jamais tous synchronisés (ce serait un gadget visuel, pas une composition vivante). */
  floatVariant?: 0 | 1 | 2;
}

/** Carte flottante décorative — composée autour d'une grande interface (hero, sections
 * spectaculaires), jamais codée en dur dans le composant d'interface lui-même, pour permettre un
 * contenu différent par page. Masquée sous `lg` pour ne jamais chevaucher le contenu sur mobile
 * (le mandat exige un rendu mobile parfaitement lisible). */
export function FloatingBadge({ icon, children, position, tone = "default", floatVariant = 0 }: FloatingBadgeProps) {
  return (
    <div
      className={`pointer-events-none absolute z-10 hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg lg:flex ${POSITION_CLASS[position]} ${TONE_CLASS[tone]} ${FLOAT_CLASS[floatVariant]}`}
    >
      {icon}
      {children}
    </div>
  );
}
