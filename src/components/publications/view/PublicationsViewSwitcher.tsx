"use client";

import type { PublicationsViewType } from "@/components/publications/view/publications-view-storage";

const VIEWS: { id: PublicationsViewType; label: string }[] = [
  { id: "table", label: "Tableau" },
  { id: "kanban", label: "Kanban" },
  { id: "calendar", label: "Calendrier" },
  { id: "cards", label: "Cartes" },
  { id: "list", label: "Liste" },
];

interface PublicationsViewSwitcherProps {
  value: PublicationsViewType;
  onChange: (view: PublicationsViewType) => void;
}

export function PublicationsViewSwitcher({ value, onChange }: PublicationsViewSwitcherProps) {
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
