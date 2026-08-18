"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useThemesSession } from "@/lib/themes-store";
import { normalizeTopicLabel } from "@/lib/topic-generator";
import type { ThemeSuggestion } from "@/lib/ai/parse-theme-suggestions";
import type { Brand } from "@/types/brand";

const INPUT_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface SuggestApiResponse {
  status: "ok" | "error";
  suggestions?: ThemeSuggestion[];
  code?: string;
  message?: string;
}

interface BrandThemesSectionProps {
  brand: Brand;
  canManage: boolean;
}

/** Thématiques intégrées à la fiche de marque — même store que /thematiques (useThemesSession),
 * filtré sur cette marque. Aucun second système. Jamais un type de contenu enregistré ici. */
export function BrandThemesSection({ brand, canManage }: BrandThemesSectionProps) {
  const t = useTranslations();
  const { themes, addTheme, updateTheme, toggleThemeActive, moveTheme } = useThemesSession();
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<ThemeSuggestion[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const brandThemes = themes.filter((theme) => theme.brandId === brand.id).sort((a, b) => a.order - b.order);

  function existingLabelMatch(label: string): boolean {
    const normalized = normalizeTopicLabel(label);
    return brandThemes.some((theme) => normalizeTopicLabel(theme.label) === normalized);
  }

  function handleCreate() {
    const label = newLabel.trim();
    if (!label) return;
    if (existingLabelMatch(label)) {
      setDuplicateError(t("brands.themesSection.duplicateError"));
      return;
    }
    const keywords = newKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    addTheme(brand.id, { label, description: newDescription.trim() || undefined, keywords });
    setNewLabel("");
    setNewDescription("");
    setNewKeywords("");
    setDuplicateError(null);
    setIsCreating(false);
  }

  async function handleSuggest() {
    setIsSuggesting(true);
    setSuggestError(null);
    setSuggestions(null);
    try {
      const response = await fetch("/api/ia/marques/suggest-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      });
      const data = (await response.json().catch(() => null)) as SuggestApiResponse | null;
      if (!data || data.status !== "ok" || !data.suggestions) {
        setSuggestError(data?.message ?? t("brands.themesSection.suggestionsUnavailable"));
        return;
      }
      setSuggestions(data.suggestions);
      setSelectedSuggestions(new Set());
    } catch {
      setSuggestError(t("brands.themesSection.suggestionsUnavailableNetwork"));
    } finally {
      setIsSuggesting(false);
    }
  }

  function toggleSuggestion(name: string) {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleAddSelectedSuggestions() {
    if (!suggestions) return;
    suggestions
      .filter((suggestion) => selectedSuggestions.has(suggestion.name) && !existingLabelMatch(suggestion.name))
      .forEach((suggestion) => {
        addTheme(brand.id, { label: suggestion.name, description: suggestion.description });
      });
    setSuggestions(null);
    setSelectedSuggestions(new Set());
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground ">{t("brands.themesSection.title")}</h2>
          <p className="text-xs text-muted-foreground ">
            {t("brands.themesSection.description", { industry: brand.industry || t("brands.themesSection.industryFallback") })}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSuggest()}
              disabled={isSuggesting}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {isSuggesting ? t("brands.themesSection.suggesting") : t("brands.themesSection.suggestButton")}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating((prev) => !prev)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              {t("brands.themesSection.newThemeButton")}
            </button>
          </div>
        )}
      </div>

      {suggestError && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {suggestError}
        </p>
      )}

      {suggestions && (
        <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
            {t("brands.themesSection.suggestionsIntro")}
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((suggestion) => {
              const alreadyExists = existingLabelMatch(suggestion.name);
              return (
                <label
                  key={suggestion.name}
                  className={`flex items-start gap-2 rounded-lg border border-border bg-surface p-2.5 text-sm ${alreadyExists ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={alreadyExists}
                    checked={selectedSuggestions.has(suggestion.name)}
                    onChange={() => toggleSuggestion(suggestion.name)}
                    className="mt-0.5"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {suggestion.name} {alreadyExists && t("brands.themesSection.alreadyPresentSuffix")}
                    </span>
                    <span className="text-xs text-muted-foreground ">{suggestion.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddSelectedSuggestions}
              disabled={selectedSuggestions.size === 0}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("brands.themesSection.addSelectionButton", { count: selectedSuggestions.size })}
            </button>
            <button type="button" onClick={() => setSuggestions(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground ">
              {t("brands.themesSection.closeButton")}
            </button>
          </div>
        </div>
      )}

      {isCreating && canManage && (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-4 ">
          <input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder={t("brands.themesSection.namePlaceholder")} className={INPUT_CLASS} />
          <input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder={t("brands.themesSection.descriptionPlaceholder")} className={INPUT_CLASS} />
          <input value={newKeywords} onChange={(event) => setNewKeywords(event.target.value)} placeholder={t("brands.themesSection.keywordsPlaceholder")} className={INPUT_CLASS} />
          {duplicateError && <span className="text-xs font-medium text-red-500">{duplicateError}</span>}
          <div className="flex gap-2">
            <button type="button" onClick={handleCreate} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white">
              {t("brands.themesSection.addButton")}
            </button>
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground ">
              {t("brands.themesSection.cancelButton")}
            </button>
          </div>
        </div>
      )}

      {brandThemes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          {t("brands.themesSection.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {brandThemes.map((theme, index) => (
            <div
              key={theme.id}
              className={`flex flex-col gap-1 rounded-lg border p-3 ${theme.active ? "border-border " : "border-dashed border-zinc-300 opacity-60 dark:border-white/[.12]"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={theme.label}
                  disabled={!canManage}
                  onChange={(event) => updateTheme(theme.id, { label: event.target.value })}
                  className={`${INPUT_CLASS} flex-1 min-w-[10rem]`}
                />
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={index === 0} onClick={() => moveTheme(theme.id, "up")} aria-label={t("brands.themesSection.moveUpAria")} className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 ">
                      ↑
                    </button>
                    <button type="button" disabled={index === brandThemes.length - 1} onClick={() => moveTheme(theme.id, "down")} aria-label={t("brands.themesSection.moveDownAria")} className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 ">
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleThemeActive(theme.id)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-muted  dark:text-zinc-400"
                    >
                      {theme.active ? t("brands.themesSection.deactivateButton") : t("brands.themesSection.reactivateButton")}
                    </button>
                  </div>
                )}
              </div>
              <input
                value={theme.description ?? ""}
                disabled={!canManage}
                onChange={(event) => updateTheme(theme.id, { description: event.target.value })}
                placeholder={t("brands.themesSection.descriptionPlaceholder")}
                className={`${INPUT_CLASS} text-xs`}
              />
              <input
                value={(theme.keywords ?? []).join(", ")}
                disabled={!canManage}
                onChange={(event) =>
                  updateTheme(theme.id, {
                    keywords: event.target.value
                      .split(",")
                      .map((keyword) => keyword.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={t("brands.themesSection.keywordsPlaceholder")}
                className={`${INPUT_CLASS} text-xs`}
              />
              {!theme.active && <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ">{t("brands.themesSection.deactivatedBadge")}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
