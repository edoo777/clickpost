"use client";

import {
  ALL_CONTENT_TYPES,
  CONTENT_TYPE_LABEL,
  buildBalancedDistribution,
  sumDistribution,
  type ContentType,
} from "@/lib/content-types";
import type { Theme } from "@/types/theme";

export interface ThemeSelectionValue {
  themeId: string;
  requestedCount: number;
  distributionMode: "auto" | "custom";
  /** Types de contenu à répartir automatiquement, ou clés de la répartition personnalisée. */
  selectedContentTypes: ContentType[];
  customDistribution: Partial<Record<ContentType, number>>;
}

export function buildDefaultThemeSelection(themeId: string): ThemeSelectionValue {
  return {
    themeId,
    requestedCount: 10,
    distributionMode: "auto",
    selectedContentTypes: ["advice", "information", "proof"],
    customDistribution: {},
  };
}

export function resolvedDistributionTotal(selection: ThemeSelectionValue): number {
  if (selection.distributionMode === "auto") return selection.requestedCount;
  return sumDistribution(
    Object.entries(selection.customDistribution).map(([contentType, count]) => ({
      contentType: contentType as ContentType,
      count: count ?? 0,
    }))
  );
}

const FIELD_CLASS = "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface ThemeSelectionPanelProps {
  theme: Theme;
  value: ThemeSelectionValue;
  onChange: (value: ThemeSelectionValue) => void;
  onRemove: () => void;
}

export function ThemeSelectionPanel({ theme, value, onChange, onRemove }: ThemeSelectionPanelProps) {
  const total = resolvedDistributionTotal(value);
  const totalMismatch = value.distributionMode === "custom" && total !== value.requestedCount;

  function toggleContentType(contentType: ContentType) {
    const isSelected = value.selectedContentTypes.includes(contentType);
    onChange({
      ...value,
      selectedContentTypes: isSelected
        ? value.selectedContentTypes.filter((candidate) => candidate !== contentType)
        : [...value.selectedContentTypes, contentType],
    });
  }

  function switchMode(mode: "auto" | "custom") {
    if (mode === "custom" && Object.keys(value.customDistribution).length === 0) {
      const balanced = buildBalancedDistribution(value.requestedCount, value.selectedContentTypes);
      onChange({
        ...value,
        distributionMode: mode,
        customDistribution: Object.fromEntries(balanced.map((entry) => [entry.contentType, entry.count])),
      });
      return;
    }
    onChange({ ...value, distributionMode: mode });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 ">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{theme.label}</span>
        <button type="button" onClick={onRemove} className="text-xs font-medium text-red-500 hover:underline">
          Retirer
        </button>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Nombre d&apos;idées pour cette thématique
        <input
          type="number"
          min={1}
          max={100}
          value={value.requestedCount}
          onChange={(event) => onChange({ ...value, requestedCount: Number(event.target.value) })}
          className={`${FIELD_CLASS} w-32`}
        />
      </label>

      <div className="flex items-center gap-1 rounded-lg border border-border p-1 w-fit">
        <button
          type="button"
          onClick={() => switchMode("auto")}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value.distributionMode === "auto"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              : "text-muted-foreground "
          }`}
        >
          Répartition automatique
        </button>
        <button
          type="button"
          onClick={() => switchMode("custom")}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value.distributionMode === "custom"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              : "text-muted-foreground "
          }`}
        >
          Répartition personnalisée
        </button>
      </div>

      {value.distributionMode === "auto" ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground ">
            Types de contenu à répartir également ({value.selectedContentTypes.length} sélectionné
            {value.selectedContentTypes.length > 1 ? "s" : ""})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CONTENT_TYPES.map((contentType) => {
              const isSelected = value.selectedContentTypes.includes(contentType);
              return (
                <button
                  key={contentType}
                  type="button"
                  onClick={() => toggleContentType(contentType)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                      : "border-border text-zinc-600  dark:text-zinc-400"
                  }`}
                >
                  {CONTENT_TYPE_LABEL[contentType]}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground ">Répartition personnalisée par type de contenu</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALL_CONTENT_TYPES.map((contentType) => (
              <label key={contentType} className="flex flex-col gap-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                {CONTENT_TYPE_LABEL[contentType]}
                <input
                  type="number"
                  min={0}
                  value={value.customDistribution[contentType] ?? 0}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      customDistribution: { ...value.customDistribution, [contentType]: Number(event.target.value) },
                    })
                  }
                  className={FIELD_CLASS}
                />
              </label>
            ))}
          </div>
          <span className={`text-xs font-medium ${totalMismatch ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            Total : {total} / {value.requestedCount} idée{value.requestedCount > 1 ? "s" : ""} demandée
            {value.requestedCount > 1 ? "s" : ""}
            {totalMismatch && " — la répartition doit correspondre exactement au nombre demandé."}
          </span>
        </div>
      )}
    </div>
  );
}
