"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";

export type PublicationCreationMode = "manual" | "claude";

/**
 * Sélecteur Manuel / Avec Claude — contrôle uniquement l'affichage du panneau de génération
 * (ClaudeGenerationPanel), jamais le formulaire manuel lui-même : celui-ci reste visible et
 * modifiable dans les deux modes (« sans lui retirer la possibilité de modifier chaque champ
 * manuellement »). Changer de mode ne touche jamais au contenu déjà saisi.
 */
export function PublicationModeToggle({
  mode,
  onChange,
}: {
  mode: PublicationCreationMode;
  onChange: (mode: PublicationCreationMode) => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex w-fit items-center gap-1 rounded-lg border border-border p-1">
      <button
        type="button"
        onClick={() => onChange("manual")}
        aria-pressed={mode === "manual"}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === "manual" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20" : "text-muted-foreground"
        }`}
      >
        {t("publications.modeToggle.manual")}
      </button>
      <button
        type="button"
        onClick={() => onChange("claude")}
        aria-pressed={mode === "claude"}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === "claude" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20" : "text-muted-foreground"
        }`}
      >
        {t("publications.modeToggle.withClaude")}
      </button>
    </div>
  );
}
