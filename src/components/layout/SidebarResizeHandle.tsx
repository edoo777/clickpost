"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, clampSidebarWidth, setSidebarWidth } from "@/lib/sidebar-store";

interface SidebarResizeHandleProps {
  width: number;
  disabled: boolean;
}

/**
 * Poignée de redimensionnement sur le bord droit de la sidebar (desktop uniquement — masquée
 * en mode réduit et sur mobile). Pointer Events pour unifier souris/stylet/tactile. Pendant le
 * glissement, la largeur est appliquée directement à la variable CSS `--sidebar-w` (retour
 * visuel immédiat sans re-render React à chaque frame) ; la valeur n'est persistée dans
 * localStorage — et donc synchronisée entre onglets — qu'au relâchement du pointeur.
 */
export function SidebarResizeHandle({ width, disabled }: SidebarResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  function computeNextWidth(event: ReactPointerEvent<HTMLDivElement>): number {
    const drag = dragState.current;
    if (!drag) return width;
    return clampSidebarWidth(drag.startWidth + (event.clientX - drag.startX));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    dragState.current = { startX: event.clientX, startWidth: width };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    document.documentElement.classList.add("sidebar-resizing");
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    document.documentElement.style.setProperty("--sidebar-w", `${computeNextWidth(event)}px`);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const next = computeNextWidth(event);
    dragState.current = null;
    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.documentElement.classList.remove("sidebar-resizing");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setSidebarWidth(next);
  }

  if (disabled) return null;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner la barre latérale"
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      aria-valuenow={Math.round(width)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize touch-none transition-colors lg:block ${
        isDragging ? "bg-white/30" : "bg-transparent hover:bg-white/15"
      }`}
    />
  );
}
