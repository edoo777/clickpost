"use client";

import { platformIcons } from "@/components/icons";
import { brandProfiles } from "@/lib/brand-profiles";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";
import type { TopicVarietyLevel } from "@/types/topic-batch";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];
const VARIETY_LEVELS: TopicVarietyLevel[] = ["low", "medium", "high"];
const VARIETY_LABEL: Record<TopicVarietyLevel, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

const TOGGLE_CLASS = (isSelected: boolean) =>
  `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    isSelected
      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
      : "border-border text-zinc-600  dark:text-zinc-400"
  }`;

export interface TopicGeneratorFormValue {
  brandId: string;
  themeId: string;
  name: string;
  requestedCount: number;
  targetAudience: string;
  objective: string;
  platforms: SocialPlatform[];
  formats: ContentFormat[];
  varietyLevel: TopicVarietyLevel;
  instructions: string;
}

export interface TopicGeneratorFormErrors {
  theme?: string;
  count?: string;
  platforms?: string;
  formats?: string;
}

interface TopicGeneratorFormProps {
  value: TopicGeneratorFormValue;
  onChange: (value: TopicGeneratorFormValue) => void;
  onGenerate: () => void;
  themesForBrand: Theme[];
  errors: TopicGeneratorFormErrors;
}

export function TopicGeneratorForm({
  value,
  onChange,
  onGenerate,
  themesForBrand,
  errors,
}: TopicGeneratorFormProps) {
  function togglePlatform(platform: SocialPlatform) {
    onChange({
      ...value,
      platforms: value.platforms.includes(platform)
        ? value.platforms.filter((p) => p !== platform)
        : [...value.platforms, platform],
    });
  }

  function toggleFormat(format: ContentFormat) {
    onChange({
      ...value,
      formats: value.formats.includes(format)
        ? value.formats.filter((f) => f !== format)
        : [...value.formats, format],
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Marque
          <select
            value={value.brandId}
            onChange={(event) => onChange({ ...value, brandId: event.target.value, themeId: "" })}
            className={FIELD_CLASS}
          >
            {brandProfiles.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Thématique
          <select
            value={value.themeId}
            onChange={(event) => onChange({ ...value, themeId: event.target.value })}
            className={FIELD_CLASS}
          >
            <option value="">Choisir une thématique</option>
            {themesForBrand.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label || "Sans titre"}
              </option>
            ))}
          </select>
          {errors.theme && <span className="text-xs font-medium text-red-500">{errors.theme}</span>}
          {themesForBrand.length === 0 && !errors.theme && (
            <span className="text-xs text-muted-foreground ">
              Aucune thématique active pour cette marque — gérez-les dans « Thématiques ».
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nom du bloc
          <input
            value={value.name}
            placeholder="Ex. 30 sujets IA"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nombre de sujets (1 à 100)
          <input
            type="number"
            min={1}
            max={100}
            value={value.requestedCount}
            onChange={(event) => onChange({ ...value, requestedCount: Number(event.target.value) })}
            className={FIELD_CLASS}
          />
          {errors.count && <span className="text-xs font-medium text-red-500">{errors.count}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Public cible (optionnel)
          <input
            value={value.targetAudience}
            placeholder="Ex. dirigeants de PME"
            onChange={(event) => onChange({ ...value, targetAudience: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Objectif (optionnel)
          <input
            value={value.objective}
            placeholder="Ex. générer des prises de contact"
            onChange={(event) => onChange({ ...value, objective: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Niveau de variété
          <select
            value={value.varietyLevel}
            onChange={(event) =>
              onChange({ ...value, varietyLevel: event.target.value as TopicVarietyLevel })
            }
            className={FIELD_CLASS}
          >
            {VARIETY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {VARIETY_LABEL[level]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Réseaux</span>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((platform) => {
            const Icon = platformIcons[platform];
            const isSelected = value.platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={TOGGLE_CLASS(isSelected)}
              >
                <Icon className="h-3.5 w-3.5" />
                {PLATFORM_LABEL[platform]}
              </button>
            );
          })}
        </div>
        {errors.platforms && <span className="text-xs font-medium text-red-500">{errors.platforms}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Formats</span>
        <div className="flex flex-wrap gap-2">
          {CONTENT_FORMATS.map((format) => {
            const isSelected = value.formats.includes(format);
            return (
              <button
                key={format}
                type="button"
                onClick={() => toggleFormat(format)}
                className={TOGGLE_CLASS(isSelected)}
              >
                {FORMAT_LABEL[format]}
              </button>
            );
          })}
        </div>
        {errors.formats && <span className="text-xs font-medium text-red-500">{errors.formats}</span>}
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Consigne complémentaire (optionnel)
        <textarea
          rows={2}
          value={value.instructions}
          placeholder="Ex. privilégier un ton pédagogique, éviter le jargon technique"
          onChange={(event) => onChange({ ...value, instructions: event.target.value })}
          className={FIELD_CLASS}
        />
      </label>

      <button
        type="button"
        onClick={onGenerate}
        className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
      >
        Générer les sujets
      </button>
    </div>
  );
}
