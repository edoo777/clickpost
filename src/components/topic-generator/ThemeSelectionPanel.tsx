"use client";

import { platformIcons } from "@/components/icons";
import {
  ALL_CONTENT_TYPES,
  CONTENT_TYPE_LABEL,
  buildBalancedDistribution,
  sumDistribution,
  type ContentType,
} from "@/lib/content-types";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

export interface ThemeSelectionValue {
  themeId: string;
  /** true = thématique ponctuelle saisie manuellement, absente des paramètres de la marque. */
  isAdhoc: boolean;
  /** Toujours renseigné : libellé réel de la thématique, ou libellé ponctuel saisi. */
  themeLabel: string;
  requestedCount: number;
  distributionMode: "auto" | "custom";
  /** Types de contenu à répartir automatiquement, ou clés de la répartition personnalisée. */
  selectedContentTypes: ContentType[];
  customDistribution: Partial<Record<ContentType, number>>;
  /** Option avancée « Personnaliser pour cette thématique » — remplace formats/plateformes/
   * objectif globaux uniquement pour cette ligne lorsqu'activée. */
  customizeOverrides: boolean;
  formats?: ContentFormat[];
  platforms?: SocialPlatform[];
  objective?: string;
}

export function buildDefaultThemeSelection(themeId: string, themeLabel: string, isAdhoc = false): ThemeSelectionValue {
  return {
    themeId,
    isAdhoc,
    themeLabel,
    requestedCount: 10,
    distributionMode: "auto",
    selectedContentTypes: ["advice", "information", "proof"],
    customDistribution: {},
    customizeOverrides: false,
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

const TOGGLE_CLASS = (isSelected: boolean) =>
  `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
    isSelected
      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
      : "border-border text-zinc-600  dark:text-zinc-400"
  }`;

interface ThemeSelectionPanelProps {
  value: ThemeSelectionValue;
  onChange: (value: ThemeSelectionValue) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** Plateformes disponibles pour la marque active (comptes affiliés) — pour l'option
   * « Personnaliser pour cette thématique ». */
  availablePlatforms: SocialPlatform[];
  /** Visible uniquement pour une thématique ponctuelle non encore ajoutée aux paramètres de la
   * marque, et seulement si l'utilisateur a la permission de gérer les marques (owner/admin). */
  onAddToBrandSettings?: () => void;
}

export function ThemeSelectionPanel({
  value,
  onChange,
  onRemove,
  onDuplicate,
  availablePlatforms,
  onAddToBrandSettings,
}: ThemeSelectionPanelProps) {
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

  function toggleOverrides(enabled: boolean) {
    if (enabled) {
      onChange({ ...value, customizeOverrides: true, formats: value.formats ?? [...CONTENT_FORMATS], platforms: value.platforms ?? [...availablePlatforms] });
    } else {
      onChange({ ...value, customizeOverrides: false });
    }
  }

  function toggleOverrideFormat(format: ContentFormat) {
    const current = value.formats ?? [];
    onChange({
      ...value,
      formats: current.includes(format) ? current.filter((f) => f !== format) : [...current, format],
    });
  }

  function toggleOverridePlatform(platform: SocialPlatform) {
    const current = value.platforms ?? [];
    onChange({
      ...value,
      platforms: current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform],
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 ">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{value.themeLabel}</span>
          {value.isAdhoc && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              Ponctuelle — non enregistrée
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onDuplicate} className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
            Dupliquer
          </button>
          <button type="button" onClick={onRemove} className="text-xs font-medium text-red-500 hover:underline">
            Retirer
          </button>
        </div>
      </div>

      {value.isAdhoc && onAddToBrandSettings && (
        <button
          type="button"
          onClick={onAddToBrandSettings}
          className="w-fit rounded-lg border border-violet-300 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/10"
        >
          Ajouter cette thématique aux paramètres de la marque
        </button>
      )}

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

      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={value.customizeOverrides} onChange={(event) => toggleOverrides(event.target.checked)} />
        Personnaliser pour cette thématique (formats, plateformes, objectif)
      </label>

      {value.customizeOverrides && (
        <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900/40">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground ">Formats pour cette thématique</span>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_FORMATS.map((format) => (
                <button key={format} type="button" onClick={() => toggleOverrideFormat(format)} className={TOGGLE_CLASS((value.formats ?? []).includes(format))}>
                  {FORMAT_LABEL[format]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground ">Plateformes pour cette thématique</span>
            <div className="flex flex-wrap gap-1.5">
              {availablePlatforms.map((platform) => {
                const Icon = platformIcons[platform];
                return (
                  <button key={platform} type="button" onClick={() => toggleOverridePlatform(platform)} className={TOGGLE_CLASS((value.platforms ?? []).includes(platform))}>
                    <Icon className="h-3.5 w-3.5" />
                    {PLATFORM_LABEL[platform]}
                  </button>
                );
              })}
              {availablePlatforms.length === 0 && <span className="text-xs text-muted-foreground ">Aucun compte affilié.</span>}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Objectif pour cette thématique
            <input
              value={value.objective ?? ""}
              placeholder="Ex. générer des inscriptions"
              onChange={(event) => onChange({ ...value, objective: event.target.value })}
              className={FIELD_CLASS}
            />
          </label>
        </div>
      )}
    </div>
  );
}
