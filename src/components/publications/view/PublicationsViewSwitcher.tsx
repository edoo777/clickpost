"use client";

import type { PublicationsViewType } from "@/components/publications/view/publications-view-storage";
import { useTranslations } from "@/lib/i18n/locale-provider";

interface PublicationsViewSwitcherProps {
  value: PublicationsViewType;
  onChange: (view: PublicationsViewType) => void;
}

export function PublicationsViewSwitcher({ value, onChange }: PublicationsViewSwitcherProps) {
  const t = useTranslations();
  const VIEWS: { id: PublicationsViewType; label: string }[] = [
    { id: "table", label: t("publications.viewSwitcher.table") },
    { id: "kanban", label: t("publications.viewSwitcher.kanban") },
    { id: "calendar", label: t("publications.viewSwitcher.calendar") },
    { id: "cards", label: t("publications.viewSwitcher.cards") },
    { id: "list", label: t("publications.viewSwitcher.list") },
    { id: "promotion", label: t("publications.viewSwitcher.promotion") },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1 ">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => onChange(view.id)}
          aria-current={value === view.id ? "true" : undefined}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === view.id
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
              : "text-muted-foreground hover:text-foreground "
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
