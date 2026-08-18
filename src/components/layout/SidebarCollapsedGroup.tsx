"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";

interface SidebarCollapsedGroupProps {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: boolean;
  subItems: { labelKey: TranslationKey; href: string }[];
  onNavigate: () => void;
}

/**
 * Remplace, en mode réduit desktop uniquement, l'entrée de navigation "Boîte à idées" (qui
 * regroupe Générateur d'idées et Banque d'idées) par un bouton ouvrant un popover flottant —
 * la sidebar réduite étant trop étroite pour afficher un sous-menu en ligne.
 */
export function SidebarCollapsedGroup({ label, icon: Icon, isActive, subItems, onNavigate }: SidebarCollapsedGroupProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
        className={`group flex w-full items-center justify-center rounded-full p-2.5 transition-all ${
          isActive
            ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-fuchsia-900/40"
            : "text-white/60 hover:bg-white/[.06] hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!isOpen && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {label}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={label}
          className="absolute left-full top-0 z-50 ml-2 w-56 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
        >
          {subItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate();
              }}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
