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
import { ACCOUNT_STATUS_STYLE, useAccountStatusLabel } from "@/lib/account-status";
import type { GenerationTone } from "@/lib/assisted-generation";
import { TONE_LABEL } from "@/lib/assisted-generation";
import { useBrandsSession } from "@/lib/brands-store";
import { CONTENT_FORMATS, useFormatLabel } from "@/lib/editorial-constants";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import { usePlatformLabel } from "@/lib/post-status";
import { useThemesSession } from "@/lib/themes-store";
import type { Brand } from "@/types/brand";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";
import type { TopicVarietyLevel } from "@/types/topic-batch";

const VARIETY_LEVELS: TopicVarietyLevel[] = ["low", "medium", "high"];
const VARIETY_LABEL_KEY: Record<TopicVarietyLevel, TranslationKey> = {
  low: "topicGenerator.form.varietyLow",
  medium: "topicGenerator.form.varietyMedium",
  high: "topicGenerator.form.varietyHigh",
};
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

/** Comptes affiliés d'une marque — jamais un compte d'une autre marque. Distinct des plateformes
 * ciblées : un compte est nécessaire seulement plus tard pour publier/programmer/récupérer des
 * statistiques réelles, jamais pour choisir le contexte éditorial d'une génération d'idées. */
function accountsForBrand(accounts: SocialAccount[], brand: Brand): SocialAccount[] {
  return accounts.filter((account) => (account.brandId ? account.brandId === brand.id : account.brand === brand.name));
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
  const t = useTranslations();
  const { brands, canManageBrands } = useBrandsSession();
  const { accounts } = useAccountsSession();
  const { addTheme } = useThemesSession();
  const [adhocLabel, setAdhocLabel] = useState("");
  const ACCOUNT_STATUS_LABEL = useAccountStatusLabel();
  const FORMAT_LABEL = useFormatLabel();
  const PLATFORM_LABEL = usePlatformLabel();

  const isStandalone = !value.brandId;
  const selectedBrand = brands.find((candidate) => candidate.id === value.brandId);
  // Les plateformes ciblées sont toujours un contexte éditorial libre — jamais limitées aux
  // comptes réellement connectés, qui ne servent qu'à la publication/programmation ultérieure.
  const brandAccounts = selectedBrand ? accountsForBrand(accounts, selectedBrand) : [];
  const allPlatformsSelected = value.platforms.length === ALL_PLATFORMS.length;

  function togglePlatform(platform: SocialPlatform) {
    onChange({
      ...value,
      platforms: value.platforms.includes(platform)
        ? value.platforms.filter((p) => p !== platform)
        : [...value.platforms, platform],
    });
  }

  function toggleAllPlatforms() {
    onChange({ ...value, platforms: allPlatformsSelected ? [] : [...ALL_PLATFORMS] });
  }

  /** Sélectionner un compte affilié sélectionne sa plateforme correspondante — jamais l'inverse,
   * jamais de connexion OAuth demandée ici, jamais de donnée du compte lue au-delà de sa
   * plateforme et de son identifiant d'affichage déjà stockés localement. */
  function toggleAccountPlatform(account: SocialAccount) {
    togglePlatform(account.platform);
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
        : [...value.themeSelections, buildDefaultThemeSelection(theme.id, theme.label || t("publications.card.untitled"))],
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
        { ...source, themeId: crypto.randomUUID(), isAdhoc: true, themeLabel: t("topicGenerator.form.themeCopySuffix", { label: source.themeLabel }) },
      ],
    });
  }

  function handleAddToBrandSettings(selection: ThemeSelectionValue) {
    // Sans marque (génération ponctuelle), il n'y a aucune marque à laquelle rattacher la
    // thématique — `value.brandId` vaudrait "", ce qui créerait une thématique orpheline
    // (brand_id vide) invisible et ingérable. Ce cas ne doit jamais être atteignable via l'UI
    // (voir le rendu conditionnel ci-dessous), gardé ici en dernier recours.
    if (!canManageBrands || isStandalone || !value.brandId) return;
    const newThemeId = addTheme(value.brandId, { label: selection.themeLabel });
    updateThemeSelection(selection.themeId, { ...selection, themeId: newThemeId, isAdhoc: false });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      {isStandalone && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {t("topicGenerator.form.standaloneNotice")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideaWorkshop.propertiesPanel.brandLabel")}
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
            {t("publications.claudeGeneration.niche")}
            <input
              value={value.standaloneNiche}
              placeholder={t("publications.claudeGeneration.nichePlaceholder")}
              onChange={(event) => onChange({ ...value, standaloneNiche: event.target.value })}
              className={FIELD_CLASS}
            />
          </label>
        ) : (
          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("publications.claudeGeneration.niche")}
            <span className={`${FIELD_CLASS} text-muted-foreground`}>{niche || t("topicGenerator.form.nicheNotSpecified")}</span>
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("topicGenerator.form.generationNameLabel")}
          <input
            value={value.name}
            placeholder={t("topicGenerator.form.generationNamePlaceholder")}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("topicGenerator.form.themesSelectedCount", {
              count: value.themeSelections.length,
              plural: value.themeSelections.length > 1 ? "s" : "",
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {themesForBrand.map((theme) => {
            const isSelected = value.themeSelections.some((selection) => selection.themeId === theme.id);
            return (
              <button key={theme.id} type="button" onClick={() => toggleTheme(theme)} className={TOGGLE_CLASS(isSelected)}>
                {theme.label || t("publications.card.untitled")}
              </button>
            );
          })}
        </div>
        {errors.themes && <span className="text-xs font-medium text-red-500">{errors.themes}</span>}
        {themesForBrand.length === 0 && (
          <p className="text-xs text-muted-foreground ">
            {t("topicGenerator.form.noActiveThemesPrefix")}{" "}
            <Link href="/marques" className="text-violet-600 hover:underline dark:text-violet-400">
              {t("topicGenerator.form.noActiveThemesLink")}
            </Link>
            {t("topicGenerator.form.noActiveThemesSuffix")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={adhocLabel}
            onChange={(event) => setAdhocLabel(event.target.value)}
            placeholder={t("topicGenerator.form.otherThemePlaceholder")}
            className={`${FIELD_CLASS} w-56`}
          />
          <button
            type="button"
            onClick={addAdhocTheme}
            disabled={!adhocLabel.trim()}
            className="rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.16] dark:hover:border-violet-500/30 dark:hover:text-violet-300"
          >
            + {t("topicGenerator.form.addThemeToGeneration")}
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
                availablePlatforms={ALL_PLATFORMS}
                onAddToBrandSettings={
                  selection.isAdhoc && canManageBrands && !isStandalone ? () => handleAddToBrandSettings(selection) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("topicGenerator.form.targetAudienceLabel")}
          <input
            value={value.targetAudience}
            placeholder={t("topicGenerator.form.targetAudiencePlaceholder")}
            onChange={(event) => onChange({ ...value, targetAudience: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("topicGenerator.form.objectiveLabel")}
          <input
            value={value.objective}
            placeholder={t("topicGenerator.form.objectivePlaceholder")}
            onChange={(event) => onChange({ ...value, objective: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("topicGenerator.form.brandToneLabel")}
          <select value={value.tone} onChange={(event) => onChange({ ...value, tone: event.target.value as GenerationTone })} className={FIELD_CLASS}>
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {TONE_LABEL[tone]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("topicGenerator.form.varietyLevelLabel")}
          <select
            value={value.varietyLevel}
            onChange={(event) => onChange({ ...value, varietyLevel: event.target.value as TopicVarietyLevel })}
            className={FIELD_CLASS}
          >
            {VARIETY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(VARIETY_LABEL_KEY[level])}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("topicGenerator.form.periodLabel")}
          <input
            value={value.period}
            placeholder={t("topicGenerator.form.periodPlaceholder")}
            onChange={(event) => onChange({ ...value, period: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("topicGenerator.form.targetedPlatformsLabel")}</span>
        <p className="text-xs text-muted-foreground ">{t("topicGenerator.form.targetedPlatformsHint")}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleAllPlatforms} className={TOGGLE_CLASS(allPlatformsSelected)}>
            {t("topicGenerator.form.allPlatforms")}
          </button>
          {ALL_PLATFORMS.map((platform) => {
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
        {errors.platforms && <span className="text-xs font-medium text-red-500">{errors.platforms}</span>}
      </div>

      {!isStandalone && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("topicGenerator.form.brandAccountsLabel")}</span>
          {brandAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground ">
              {t("topicGenerator.form.noBrandAccountsHint")}{" "}
              <Link href="/marques" className="text-violet-600 hover:underline dark:text-violet-400">
                {t("topicGenerator.form.configureBrandAccounts")}
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brandAccounts.map((account) => {
                const Icon = platformIcons[account.platform];
                const isSelected = value.platforms.includes(account.platform);
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => toggleAccountPlatform(account)}
                    className={TOGGLE_CLASS(isSelected)}
                    title={ACCOUNT_STATUS_LABEL[account.status]}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {PLATFORM_LABEL[account.platform]} — {account.handle || account.accountName}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ACCOUNT_STATUS_STYLE[account.status]}`}>
                      {ACCOUNT_STATUS_LABEL[account.status]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("publications.form.format")}</span>
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
        {t("topicGenerator.form.additionalInstructionLabel")}
        <textarea
          rows={2}
          value={value.instructions}
          placeholder={t("topicGenerator.form.additionalInstructionPlaceholder")}
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
        {isGenerating ? t("topicGenerator.form.generatingInProgress") : t("topicGenerator.form.generateIdeas")}
      </button>
    </div>
  );
}
