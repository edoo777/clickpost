"use client";

import { useState } from "react";
import { ThemeRow } from "@/components/themes/ThemeRow";
import { useBrandsSession } from "@/lib/brands-store";
import { getThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";

export function ThemesView() {
  const { themes, addTheme, updateTheme, toggleThemeActive, toggleThemeWeekday, moveTheme, removeTheme } =
    useThemesSession();
  const { brands } = useBrandsSession();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const effectiveBrandId = brands.some((brand) => brand.id === selectedBrandId)
    ? selectedBrandId
    : (brands[0]?.id ?? "");

  const brandThemes = getThemesForBrand(themes, effectiveBrandId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          Thématiques
        </h1>
        <p className="text-sm text-muted-foreground ">
          Gérez la bibliothèque de thématiques de chaque marque et attribuez-les librement aux jours
          de la semaine.
        </p>
      </header>

      {brands.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-10 text-center text-sm text-muted-foreground dark:border-white/[.16] ">
          Aucune marque dans ce workspace. Créez-en une dans « Marques » pour commencer à gérer ses thématiques.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <select
              value={effectiveBrandId}
              onChange={(event) => setSelectedBrandId(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300"
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => addTheme(effectiveBrandId)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              + Nouvelle thématique
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {brandThemes.length === 0 && (
              <p className="text-sm text-muted-foreground ">
                Aucune thématique pour cette marque. Créez-en une pour commencer.
              </p>
            )}
            {brandThemes.map((theme, index) => (
              <ThemeRow
                key={theme.id}
                theme={theme}
                canMoveUp={index > 0}
                canMoveDown={index < brandThemes.length - 1}
                onUpdate={(patch) => updateTheme(theme.id, patch)}
                onToggleActive={() => toggleThemeActive(theme.id)}
                onToggleWeekday={(day) => toggleThemeWeekday(theme.id, day)}
                onMoveUp={() => moveTheme(theme.id, "up")}
                onMoveDown={() => moveTheme(theme.id, "down")}
                onRemove={() => removeTheme(theme.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
