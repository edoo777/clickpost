"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { SavedView } from "@/types/saved-view";

const PILL_CLASS =
  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";

interface SavedViewsBarProps {
  savedViews: SavedView[];
  activeSavedViewId: string | null;
  isModified: boolean;
  onSelect: (id: string | null) => void;
  onSaveAsNew: (name: string) => void;
  onUpdate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function SavedViewsBar({
  savedViews,
  activeSavedViewId,
  isModified,
  onSelect,
  onSaveAsNew,
  onUpdate,
  onRename,
  onDelete,
  onSetDefault,
}: SavedViewsBarProps) {
  const t = useTranslations();
  const activeView = savedViews.find((view) => view.id === activeSavedViewId);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isMenuOpen]);

  function openSaveForm(prefill: string) {
    setDraftName(prefill);
    setIsSaving(true);
  }

  function confirmSave() {
    const name = draftName.trim();
    if (!name) return;
    onSaveAsNew(name);
    setIsSaving(false);
    setDraftName("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`${PILL_CLASS} ${
          !activeView
            ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
            : "border-border text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        }`}
      >
        {t("publications.savedViews.quickView")}
      </button>

      {savedViews.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => onSelect(view.id)}
          className={`${PILL_CLASS} ${
            view.id === activeSavedViewId
              ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
              : "border-border text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          }`}
        >
          {view.name}
          {view.isDefault && " ★"}
        </button>
      ))}

      <div className="relative ml-1 flex items-center gap-1.5" ref={menuRef}>
        {activeView ? (
          <>
            {isModified && (
              <button
                type="button"
                onClick={onUpdate}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("publications.savedViews.updateView")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              aria-label={t("publications.savedViews.viewOptions")}
              className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-zinc-600 hover:bg-muted  dark:text-zinc-400"
            >
              ⋯
            </button>
            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    const name = window.prompt(t("publications.savedViews.newViewNamePrompt"), activeView.name);
                    if (name && name.trim()) onRename(name.trim());
                    setIsMenuOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  {t("publications.savedViews.rename")}
                </button>
                {!activeView.isDefault && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSetDefault();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                  >
                    {t("publications.savedViews.setDefault")}
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  {t("publications.savedViews.deleteView")}
                </button>
              </div>
            )}
          </>
        ) : isSaving ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") confirmSave();
                if (event.key === "Escape") setIsSaving(false);
              }}
              placeholder={t("publications.savedViews.viewNamePlaceholder")}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700   dark:text-zinc-300"
            />
            <button
              type="button"
              onClick={confirmSave}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              {t("common.save")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openSaveForm("")}
            className="rounded-lg border border-dashed border-zinc-400 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16] "
          >
            {t("publications.savedViews.saveView")}
          </button>
        )}
      </div>
    </div>
  );
}
