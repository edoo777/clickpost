"use client";

import { CONFLICT_ENTITY_LABEL, formatDateTime, getConflictBrandRef, getConflictTitle } from "@/lib/conflict-display";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ConflictEntry } from "@/types/conflict";

interface ConflictListItemProps {
  entry: ConflictEntry;
  brandName?: string;
  isSelected: boolean;
  onToggleSelected: () => void;
  onOpen: () => void;
}

export function ConflictListItem({ entry, brandName, isSelected, onToggleSelected, onOpen }: ConflictListItemProps) {
  const t = useTranslations();
  const title = getConflictTitle(entry.entityType, entry.local, entry.remote);
  const { brandName: inlineBrandName } = getConflictBrandRef(entry.local, entry.remote);
  const displayedBrand = brandName ?? inlineBrandName;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-zinc-400 dark:hover:border-white/[.16]">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelected}
        aria-label={t("conflicts.listItem.selectAriaLabel", { title })}
        className="h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-white/[.2]"
      />

      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {CONFLICT_ENTITY_LABEL[entry.entityType]}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">{title}</span>
          {displayedBrand && <span className="truncate text-xs text-muted-foreground">· {displayedBrand}</span>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>{t("conflicts.listItem.localLabel")} {formatDateTime(entry.local?.updatedAt)}</span>
          <span>{t("conflicts.listItem.remoteLabel")} {formatDateTime(entry.remote.updatedAt)}</span>
        </div>
      </button>

      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        {t("conflicts.listItem.pendingBadge")}
      </span>

      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20 transition-all hover:from-violet-500 hover:to-fuchsia-500"
      >
        {t("conflicts.listItem.compare")}
      </button>
    </div>
  );
}
