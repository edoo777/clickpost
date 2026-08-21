"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** Décalage en millisecondes avant le déclenchement de l'animation une fois l'élément visible —
   * utile pour échelonner une grille de cartes sans dupliquer la logique d'observation. */
  delayMs?: number;
  className?: string;
}

/**
 * Révèle son contenu (fondu + léger déplacement vers le haut, voir `.marketing-reveal` dans
 * globals.css) dès qu'il entre dans le viewport — jamais de ré-observation après la première
 * apparition (contenu marketing, pas un indicateur d'état qui doit rester synchronisé). Respecte
 * `prefers-reduced-motion` au niveau CSS (voir globals.css) : ce composant ne fait qu'ajouter la
 * classe qui déclenche l'animation, jamais de logique de mouvement en JavaScript.
 */
export function ScrollReveal({ children, delayMs = 0, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const timeout = setTimeout(() => setIsVisible(true), delayMs);
            observer.disconnect();
            return () => clearTimeout(timeout);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} className={`marketing-reveal ${isVisible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
