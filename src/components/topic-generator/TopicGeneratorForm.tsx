"use client";

import Link from "next/link";
import { useState } from "react";
import { platformIcons } from "@/components/icons";
import {
  ThemeSelectionPanel,
  buildDefaultThemeSelection,
  type ThemeSelectionValue,
} from "@/components/topic-generator/ThemeSelectionPanel";
import { useAccountsSession } from "@/lib/accounts-store";
import type { GenerationTone } from "@/lib/assisted-generation";
import { TONE_LABEL } from "@/lib/assisted-generation";
import { useBrandsSession } from "@/lib/brands-store";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { useThemesSession } from "@/lib/themes-store";
import type { Brand } from "@/types/brand";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";
import type { TopicVarietyLevel } from "@/types/topic-batch";

const VARIETY_LEVELS: TopicVarietyLevel[] = ["low", "medium", "high"];
const VARIETY_LABEL: Record<TopicVarietyLevel, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
const TONES: GenerationTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "direct",
  "pedagogical",
  "inspiring",
  "conversational",
  "expert",
  "storytelling",
  "provocative",
];

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "threads", "pinterest"];

/** Plateformes disponibles pour une marque = celles de ses comptes affiliés — jamais un compte
 * d'une autre marque, jamais la liste complète des réseaux existants. */
function platformsFromAccounts(accounts: SocialAccount[], brand: Brand): SocialPlatform[] {
  const brandAccounts = accounts.filter((account) => (account.brandId ? account.brandId === brand.id : account.brand === brand.name));
  return Array.from(new Set(brandAccounts.map((account) => account.platform)));
}

const TOGGLE_CLASS = (isSelected: boolean) =>
  `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    isSelected
      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
      : "border-border text-zinc-600  dark:text-zinc-400"
  }`;

export interface TopicGeneratorFormValue {
  brandId: string;
  /** Niche saisie manuellement — utilisée uniquement en mode ponctuel (brandId vide). */
  standaloneNiche: string;
  name: string;
  themeSelections: ThemeSelectionValue[];
  targetAudience: string;
  objective: string;
  platforms: SocialPlatform[];
  formats: ContentFormat[];
  varietyLevel: TopicVarietyLevel;
  tone: GenerationTone;
  period: string;
  instructions: string;
}

export interface TopicGeneratorFormErrors {
  themes?: string;
  platforms?: string;
  formats?: string;
}

interface TopicGeneratorFormProps {
  value: TopicGeneratorFormValue;
  onChange: (value: TopicGeneratorFormValue) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  themesForBrand: Theme[];
  niche: string;
  errors: TopicGeneratorFormErrors;
}

export function TopicGeneratorForm({
  value,
  onChange,
  onGenerate,
  isGenerating,
  themesForBrand,
  niche,
  errors,
}: TopicGeneratorFormProps) {
  const { brands, canManageBrands } = useBrandsSession();
  const { accounts } = useAccountsSession();
  const { addTheme } = useThemesSession();
  const [adhocLabel, setAdhocLabel] = useState("");

  const isStandalone = !value.brandId;
  const selectedBrand = brands.find((candidate) => candidate.id === value.brandId);
  const platformsForBrand = selectedBrand ? platformsFromAccounts(accounts, selectedBrand) : [];
  const platformChoices = isStandalone ? ALL_PLATFORMS : platformsForBrand;

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
      formats: value.formats.includes(format) ? value.formats.filter((f) => f !== format) : [...value.formats, format],
    });
  }

  function toggleTheme(theme: Theme) {
    const exists = value.themeSelections.some((selection) => selection.themeId === theme.id);
    onChange({
      ...value,
      themeSelections: exists
        ? value.themeSelections.filter((selection) => selection.themeId !== theme.id)
        : [...value.themeSelections, buildDefaultThemeSelection(theme.id, theme.label || "Sans titre")],
    });
  }

  function addAdhocTheme() {
    const label = adhocLabel.trim();
    if (!label) return;
    onChange({
      ...value,
      themeSelections: [...value.themeSelections, buildDefaultThemeSelection(crypto.randomUUID(), label, true)],
    });
    setAdhocLabel("");
  }

  function updateThemeSelection(themeId: string, next: ThemeSelectionValue) {
    onChange({
      ...value,
      themeSelections: value.themeSelections.map((selection) => (selection.themeId === themeId ? next : selection)),
    });
  }

  function removeThemeSelection(themeId: string) {
    onChange({ ...value, themeSelections: value.themeSelections.filter((selection) => selection.themeId !== themeId) });
  }

  function duplicateThemeSelection(themeId: string) {
    const source = value.themeSelections.find((selection) => selection.themeId === themeId);
    if (!source) return;
    // Duplique la configuration (quantité, répartition, personnalisations) vers un nouveau
    // brouillon ponctuel — la thématique d'origine reste inchangée, jamais dupliquée elle-même
    // (une même thématique réelle ne peut apparaître qu'une fois dans la liste).
    onChange({
      ...value,
      themeSelections: [
        ...value.themeSelections,
        { ...source, themeId: crypto.randomUUID(), isAdhoc: true, themeLabel: `${source.themeLabel} (copie)` },
      ],
    });
  }

  function handleAddToBrandSettings(selection: ThemeSelectionValue) {
    if (!canManageBrands) return;
    const newThemeId = addTheme(value.brandId, { label: selection.themeLabel });
    updateThemeSelection(selection.themeId, { ...selection, themeId: newThemeId, isAdhoc: false });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      {isStandalone && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Génération ponctuelle — sans marque associée. Rien n&apos;est enregistré dans les paramètres tant que vous ne le
          confirmez pas explicitement.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Marque
            <select
              value={value.brandId}
              onChange={(event) => onChange({ ...value, brandId: event.target.value, themeSelections: [] })}
              className={FIELD_CLASS}
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isStandalone ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Niche
            <input
              value={value.standaloneNiche}
              placeholder="Ex. Fitness"
              onChange={(event) => onChange({ ...value, standaloneNiche: event.target.value })}
              className={FIELD_CLASS}
            />
          </label>
        ) : (
          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Niche
            <span className={`${FIELD_CLASS} text-muted-foreground`}>{niche || "Non précisée sur la marque"}</span>
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nom de la génération
          <input
            value={value.name}
            placeholder="Ex. Plan de contenu Fitness — semaine 1"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Thématiques ({value.themeSelections.length} sélectionnée{value.themeSelections.length > 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {themesForBrand.map((theme) => {
            const isSelected = value.themeSelections.some((selection) => selection.themeId === theme.id);
            return (
              <button key={theme.id} type="button" onClick={() => toggleTheme(theme)} className={TOGGLE_CLASS(isSelected)}>
                {theme.label || "Sans titre"}
              </button>
            );
          })}
        </div>
        {errors.themes && <span className="text-xs font-medium text-red-500">{errors.themes}</span>}
        {themesForBrand.length === 0 && (
          <p className="text-xs text-muted-foreground ">
            Aucune thématique active pour cette marque —{" "}
            <Link href="/marques" className="text-violet-600 hover:underline dark:text-violet-400">
              configurez-les dans les paramètres de la marque
            </Link>
            , ou utilisez une thématique ponctuelle ci-dessous.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={adhocLabel}
            onChange={(event) => setAdhocLabel(event.target.value)}
            placeholder="Autre thématique…"
            className={`${FIELD_CLASS} w-56`}
          />
          <button
            type="button"
            onClick={addAdhocTheme}
            disabled={!adhocLabel.trim()}
            className="rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.16] dark:hover:border-violet-500/30 dark:hover:text-violet-300"
          >
            + Ajouter cette thématique à la génération
          </button>
        </div>

        {value.themeSelections.length > 0 && (
          <div className="flex flex-col gap-2">
            {value.themeSelections.map((selection) => (
              <ThemeSelectionPanel
                key={selection.themeId}
                value={selection}
                onChange={(next) => updateThemeSelection(selection.themeId, next)}
                onRemove={() => removeThemeSelection(selection.themeId)}
                onDuplicate={() => duplicateThemeSelection(selection.themeId)}
                availablePlatforms={platformsForBrand}
                onAddToBrandSettings={
                  selection.isAdhoc && canManageBrands ? () => handleAddToBrandSettings(selection) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          Ton de marque
          <select value={value.tone} onChange={(event) => onChange({ ...value, tone: event.target.value as GenerationTone })} className={FIELD_CLASS}>
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {TONE_LABEL[tone]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Niveau de variété (mode simulé)
          <select
            value={value.varietyLevel}
            onChange={(event) => onChange({ ...value, varietyLevel: event.target.value as TopicVarietyLevel })}
            className={FIELD_CLASS}
          >
            {VARIETY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {VARIETY_LABEL[level]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Période (optionnel)
          <input
            value={value.period}
            placeholder="Ex. Semaines du 3 au 17 août"
            onChange={(event) => onChange({ ...value, period: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {isStandalone ? "Réseaux" : "Réseaux (comptes affiliés de la marque)"}
        </span>
        <div className="flex flex-wrap gap-2">
          {platformChoices.map((platform) => {
            const Icon = platformIcons[platform];
            const isSelected = value.platforms.includes(platform);
            return (
              <button key={platform} type="button" onClick={() => togglePlatform(platform)} className={TOGGLE_CLASS(isSelected)}>
                <Icon className="h-3.5 w-3.5" />
                {PLATFORM_LABEL[platform]}
              </button>
            );
          })}
        </div>
        {!isStandalone && platformsForBrand.length === 0 && (
          <span className="text-xs text-muted-foreground ">
            Aucun compte affilié pour cette marque — ajoutez-en un depuis sa fiche (onglet Comptes affiliés).
          </span>
        )}
        {errors.platforms && <span className="text-xs font-medium text-red-500">{errors.platforms}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Formats</span>
        <div className="flex flex-wrap gap-2">
          {CONTENT_FORMATS.map((format) => {
            const isSelected = value.formats.includes(format);
            return (
              <button key={format} type="button" onClick={() => toggleFormat(format)} className={TOGGLE_CLASS(isSelected)}>
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
        disabled={isGenerating}
        className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Génération en cours…" : "Générer les idées"}
      </button>
    </div>
  );
}
