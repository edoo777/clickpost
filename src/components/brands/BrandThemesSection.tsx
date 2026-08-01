"use client";

import { useState } from "react";
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
      setDuplicateError("Cette thématique existe déjà pour cette marque — réactivez-la plutôt que d'en créer une nouvelle.");
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
        setSuggestError(data?.message ?? "Suggestions indisponibles pour le moment.");
        return;
      }
      setSuggestions(data.suggestions);
      setSelectedSuggestions(new Set());
    } catch {
      setSuggestError("Suggestions indisponibles pour le moment (connexion réseau).");
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
          <h2 className="text-sm font-semibold text-foreground ">Thématiques</h2>
          <p className="text-xs text-muted-foreground ">
            Sujets éditoriaux découlant de la niche « {brand.industry || "non précisée"} » — jamais
            un type de contenu (Conseil, Preuve, Offre…).
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
              {isSuggesting ? "Suggestion en cours…" : "Suggérer des thématiques avec Claude"}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating((prev) => !prev)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              + Nouvelle thématique
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
            Suggestions Claude — sélectionnez celles à ajouter, rien n&apos;est enregistré automatiquement.
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
                      {suggestion.name} {alreadyExists && "(déjà présente)"}
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
              Ajouter la sélection ({selectedSuggestions.size})
            </button>
            <button type="button" onClick={() => setSuggestions(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground ">
              Fermer
            </button>
          </div>
        </div>
      )}

      {isCreating && canManage && (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-4 ">
          <input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="Nom de la thématique (ex. Musculation)" className={INPUT_CLASS} />
          <input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="Description (optionnel)" className={INPUT_CLASS} />
          <input value={newKeywords} onChange={(event) => setNewKeywords(event.target.value)} placeholder="Mots-clés séparés par des virgules (optionnel)" className={INPUT_CLASS} />
          {duplicateError && <span className="text-xs font-medium text-red-500">{duplicateError}</span>}
          <div className="flex gap-2">
            <button type="button" onClick={handleCreate} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white">
              Ajouter
            </button>
            <button type="button" onClick={() => setIsCreating(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground ">
              Annuler
            </button>
          </div>
        </div>
      )}

      {brandThemes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          Aucune thématique pour cette marque pour l&apos;instant.
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
                    <button type="button" disabled={index === 0} onClick={() => moveTheme(theme.id, "up")} aria-label="Monter" className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 ">
                      ↑
                    </button>
                    <button type="button" disabled={index === brandThemes.length - 1} onClick={() => moveTheme(theme.id, "down")} aria-label="Descendre" className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 ">
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleThemeActive(theme.id)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-muted  dark:text-zinc-400"
                    >
                      {theme.active ? "Désactiver" : "Réactiver"}
                    </button>
                  </div>
                )}
              </div>
              <input
                value={theme.description ?? ""}
                disabled={!canManage}
                onChange={(event) => updateTheme(theme.id, { description: event.target.value })}
                placeholder="Description (optionnel)"
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
                placeholder="Mots-clés séparés par des virgules (optionnel)"
                className={`${INPUT_CLASS} text-xs`}
              />
              {!theme.active && <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ">Désactivée / archivée</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
