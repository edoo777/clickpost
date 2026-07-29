"use client";

import { useState } from "react";
import { isLowContrast } from "@/lib/color-contrast";
import { CLICKPOST_DEFAULT_BRANDING, type BrandingRadius, type BrandingThemeMode, type WorkspaceBrandingRow } from "@/lib/supabase/types";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

const LABEL_CLASS = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";
const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:text-zinc-200";

const RADIUS_OPTIONS: { value: BrandingRadius; label: string }[] = [
  { value: "none", label: "Aucun" },
  { value: "sm", label: "Léger" },
  { value: "md", label: "Moyen" },
  { value: "lg", label: "Confortable" },
  { value: "xl", label: "Prononcé" },
  { value: "full", label: "Complet" },
];

const THEME_MODE_OPTIONS: { value: BrandingThemeMode; label: string }[] = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={LABEL_CLASS}>
      {label}
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
        />
        <input value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      </span>
    </label>
  );
}

/** Paramètres → Identité visuelle : personnalisation complète, réservée aux owner/admin. */
export function BrandingSection() {
  const { workspace, branding, isAdmin, updateBranding } = useWorkspaceSession();
  const [draft, setDraft] = useState<WorkspaceBrandingRow | null>(null);
  const [initializedFromWorkspaceId, setInitializedFromWorkspaceId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (branding && workspace && initializedFromWorkspaceId !== workspace.id) {
    setInitializedFromWorkspaceId(workspace.id);
    setDraft(branding);
  }

  if (!branding || !workspace || !draft) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Identité visuelle</h2>
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </section>
    );
  }

  function set<K extends keyof WorkspaceBrandingRow>(key: K, value: WorkspaceBrandingRow[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!draft) return;
    setStatus("saving");
    setErrorMessage(null);
    const { error } = await updateBranding({
      color_primary: draft.color_primary,
      color_secondary: draft.color_secondary,
      color_accent: draft.color_accent,
      color_sidebar: draft.color_sidebar,
      color_button: draft.color_button,
      color_link: draft.color_link,
      font_heading: draft.font_heading,
      font_body: draft.font_body,
      radius: draft.radius,
      default_theme_mode: draft.default_theme_mode,
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error);
      return;
    }
    setStatus("saved");
  }

  function handleCancel() {
    setDraft(branding);
    setStatus("idle");
    setErrorMessage(null);
  }

  function handleRestoreDefaults() {
    setDraft((prev) => (prev ? { ...prev, ...CLICKPOST_DEFAULT_BRANDING } : prev));
    setStatus("idle");
  }

  const sidebarContrastLow = isLowContrast(draft.color_sidebar, "#ffffff");
  const buttonContrastLow = isLowContrast(draft.color_button, "#ffffff");

  if (!isAdmin) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Identité visuelle</h2>
        <p className="text-sm text-muted-foreground">
          Réservée aux rôles Propriétaire et Administrateur de l&apos;espace de travail.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Identité visuelle</h2>
        <p className="text-xs text-muted-foreground">
          Personnalisez l&apos;apparence de votre espace de travail. Les modifications s&apos;appliquent après
          enregistrement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ColorField label="Couleur principale" value={draft.color_primary} onChange={(value) => set("color_primary", value)} />
        <ColorField label="Couleur secondaire" value={draft.color_secondary} onChange={(value) => set("color_secondary", value)} />
        <ColorField label="Couleur d'accent" value={draft.color_accent} onChange={(value) => set("color_accent", value)} />
        <ColorField label="Couleur de la sidebar" value={draft.color_sidebar} onChange={(value) => set("color_sidebar", value)} />
        <ColorField label="Couleur des boutons" value={draft.color_button} onChange={(value) => set("color_button", value)} />
        <ColorField label="Couleur des liens" value={draft.color_link} onChange={(value) => set("color_link", value)} />
      </div>

      {(sidebarContrastLow || buttonContrastLow) && (
        <div className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span>⚠ Combinaison de couleurs peu lisible :</span>
          {sidebarContrastLow && <span>— la couleur de la sidebar offre un contraste insuffisant avec un texte blanc.</span>}
          {buttonContrastLow && <span>— la couleur des boutons offre un contraste insuffisant avec un texte blanc.</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          Typographie des titres
          <input value={draft.font_heading} onChange={(event) => set("font_heading", event.target.value)} className={FIELD_CLASS} />
        </label>
        <label className={LABEL_CLASS}>
          Typographie du texte
          <input value={draft.font_body} onChange={(event) => set("font_body", event.target.value)} className={FIELD_CLASS} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          Arrondi des cartes et boutons
          <select value={draft.radius} onChange={(event) => set("radius", event.target.value as BrandingRadius)} className={FIELD_CLASS}>
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Apparence par défaut
          <select
            value={draft.default_theme_mode}
            onChange={(event) => set("default_theme_mode", event.target.value as BrandingThemeMode)}
            className={FIELD_CLASS}
          >
            {THEME_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aperçu instantané</span>
        <div
          className="flex flex-col gap-3 rounded-xl border border-border p-4"
          style={{ borderRadius: RADIUS_PREVIEW[draft.radius] }}
        >
          <div
            className="flex items-center justify-between gap-3 rounded-lg p-3"
            style={{ backgroundColor: draft.color_sidebar, borderRadius: RADIUS_PREVIEW[draft.radius] }}
          >
            <span className="text-sm font-semibold text-white" style={{ fontFamily: draft.font_heading }}>
              {workspace.name}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: `linear-gradient(to right, ${draft.color_primary}, ${draft.color_secondary})`, borderRadius: RADIUS_PREVIEW.full }}
            >
              Actif
            </span>
          </div>
          <p className="text-sm text-foreground" style={{ fontFamily: draft.font_body }}>
            Exemple de texte utilisant la typographie sélectionnée, avec un{" "}
            <a href="#" onClick={(event) => event.preventDefault()} style={{ color: draft.color_link }} className="underline">
              lien d&apos;exemple
            </a>
            .
          </p>
          <button
            type="button"
            disabled
            className="w-fit px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: draft.color_button, borderRadius: RADIUS_PREVIEW[draft.radius] }}
          >
            Bouton principal
          </button>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      {status === "saved" && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Identité visuelle enregistrée et appliquée.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Restaurer l&apos;identité ClickPost
        </button>
      </div>
    </section>
  );
}

const RADIUS_PREVIEW: Record<BrandingRadius, string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};
