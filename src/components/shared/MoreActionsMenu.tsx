"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";

export interface MoreActionsMenuItem {
  key: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface MoreActionsMenuProps {
  items: MoreActionsMenuItem[];
}

/**
 * Menu générique « ... » pour les actions secondaires (Dupliquer/Archiver/Supprimer…) — évite de
 * multiplier les boutons visibles en permanence à côté des actions principales. Purement
 * présentationnel : chaque item reste responsable de sa propre logique (aucune action n'est
 * dupliquée ici).
 */
export function MoreActionsMenu({ items }: MoreActionsMenuProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
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

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t("moreActionsMenu.trigger")}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ⋯
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t("moreActionsMenu.trigger")}
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                item.destructive
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  : "text-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
