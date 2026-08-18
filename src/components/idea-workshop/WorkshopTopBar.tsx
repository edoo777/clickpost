"use client";

import Link from "next/link";
import { IconLayoutDocument, IconLayoutSplit } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Idea } from "@/types/idea";

export type WorkshopDisplayMode = "document" | "structured";

interface PrimaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

interface WorkshopTopBarProps {
  idea: Idea;
  brandLabel: string;
  themeLabel?: string;
  mode: WorkshopDisplayMode;
  onModeChange: (mode: WorkshopDisplayMode) => void;
  onTitleChange: (title: string) => void;
  primaryAction: PrimaryAction | null;
  onSaveVersion: () => void;
}

/**
 * Barre supérieure compacte de l'Atelier : titre modifiable, bascule de mode, et une action de
 * sortie dominante déterminée par l'état de l'idée (jamais plus d'une action mise en avant).
 */
export function WorkshopTopBar({
  idea,
  brandLabel,
  themeLabel,
  mode,
  onModeChange,
  onTitleChange,
  primaryAction,
  onSaveVersion,
}: WorkshopTopBarProps) {
  const t = useTranslations();
  return (
    <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link href="/boite-idees?tab=banque" className="shrink-0 text-xs font-medium text-muted-foreground hover:underline">
            ← {t("ideaWorkshop.topBar.ideasBank")}
          </Link>
          <span className="text-xs text-muted-foreground">
            {brandLabel}
            {themeLabel ? ` · ${themeLabel}` : ""}
          </span>
        </div>
        <input
          value={idea.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={t("ideaWorkshop.topBar.ideaTitle")}
          aria-label={t("ideaWorkshop.topBar.ideaTitle")}
          className="w-full min-w-0 truncate rounded-lg border border-transparent bg-transparent px-0 text-xl font-semibold tracking-tight text-foreground focus:border-border focus:bg-muted focus:px-2 focus:py-1"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label={t("ideaWorkshop.topBar.displayMode")}
          className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "document"}
            onClick={() => onModeChange("document")}
            title={t("ideaWorkshop.topBar.freeModeTitle")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              mode === "document" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconLayoutDocument className="h-3.5 w-3.5" />
            {t("ideaWorkshop.topBar.freeMode")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "structured"}
            onClick={() => onModeChange("structured")}
            title={t("ideaWorkshop.topBar.structuredModeTitle")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              mode === "structured" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconLayoutSplit className="h-3.5 w-3.5" />
            {t("ideaWorkshop.topBar.structuredMode")}
          </button>
        </div>

        <button
          type="button"
          onClick={onSaveVersion}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {t("ideaWorkshop.topBar.saveVersion")}
        </button>

        {idea.publicationId && (
          <Link
            href={`/publications/${idea.publicationId}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {t("ideaWorkshop.topBar.openPublication")}
          </Link>
        )}

        {primaryAction && (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
            >
              {primaryAction.label}
            </button>
            {primaryAction.disabled && primaryAction.disabledHint && (
              <span className="text-[11px] text-muted-foreground">{primaryAction.disabledHint}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
