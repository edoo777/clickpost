"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconSettingsGear } from "@/components/icons";
import { ConflictBadge } from "@/components/conflicts/ConflictBadge";
import { CONFLICTS_NAV_HREF, MANAGEMENT_NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { useSyncStatus } from "@/lib/sync/use-sync-status";

interface ManagementMenuProps {
  onNavigate?: () => void;
  triggerClassName?: string;
  /** N'affiche que l'icône (bouton compact, ex. barre mobile) — le popover reste identique. */
  iconOnly?: boolean;
}

/**
 * Menu déroulant unique regroupant Comptes / Équipe / Approbations / Paramètres — mêmes
 * routes que les boutons individuels de la barre supérieure sur grand écran (une seule liste
 * de vérité : `MANAGEMENT_NAV_ITEMS`). Réutilisé à la fois dans la barre supérieure (largeur
 * réduite) et dans la barre mobile, pour ne jamais coder ces liens à plusieurs endroits.
 */
export function ManagementMenu({ onNavigate, triggerClassName, iconOnly }: ManagementMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnyActive = MANAGEMENT_NAV_ITEMS.some((item) => isNavItemActive(pathname, item.href));
  const conflictCount = useSyncStatus().conflictCount;

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={conflictCount > 0 ? `Gestion — ${conflictCount} conflit${conflictCount > 1 ? "s" : ""} à résoudre` : "Gestion"}
        className={
          triggerClassName ??
          `relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isAnyActive
              ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
              : "text-zinc-600 hover:bg-muted dark:text-zinc-400"
          }`
        }
      >
        <span className="relative">
          <IconSettingsGear className="h-4 w-4 shrink-0" />
          {iconOnly && <ConflictBadge count={conflictCount} className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white" />}
        </span>
        {!iconOnly && (
          <>
            <span>Gestion</span>
            <ConflictBadge count={conflictCount} />
            <IconChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Gestion"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
        >
          {MANAGEMENT_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                }}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "text-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {item.href === CONFLICTS_NAV_HREF && <ConflictBadge count={conflictCount} className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
