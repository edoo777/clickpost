"use client";

import { useState } from "react";
import { isLowContrast } from "@/lib/color-contrast";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { CLICKPOST_DEFAULT_BRANDING, type BrandingRadius, type BrandingThemeMode, type WorkspaceBrandingRow } from "@/lib/supabase/types";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

const LABEL_CLASS = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";
const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:text-zinc-200";

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
  const t = useTranslations();
  const RADIUS_OPTIONS: { value: BrandingRadius; label: string }[] = [
    { value: "none", label: t("settings.branding.radiusOptions.none") },
    { value: "sm", label: t("settings.branding.radiusOptions.sm") },
    { value: "md", label: t("settings.branding.radiusOptions.md") },
    { value: "lg", label: t("settings.branding.radiusOptions.lg") },
    { value: "xl", label: t("settings.branding.radiusOptions.xl") },
    { value: "full", label: t("settings.branding.radiusOptions.full") },
  ];
  const THEME_MODE_OPTIONS: { value: BrandingThemeMode; label: string }[] = [
    { value: "light", label: t("settings.branding.themeModeOptions.light") },
    { value: "dark", label: t("settings.branding.themeModeOptions.dark") },
    { value: "system", label: t("settings.branding.themeModeOptions.system") },
  ];
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
        <h2 className="text-sm font-semibold text-foreground">{t("settings.branding.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.branding.loading")}</p>
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
        <h2 className="text-sm font-semibold text-foreground">{t("settings.branding.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("settings.branding.adminOnlyNotice")}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{t("settings.branding.title")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("settings.branding.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ColorField label={t("settings.branding.primaryColorLabel")} value={draft.color_primary} onChange={(value) => set("color_primary", value)} />
        <ColorField label={t("settings.branding.secondaryColorLabel")} value={draft.color_secondary} onChange={(value) => set("color_secondary", value)} />
        <ColorField label={t("settings.branding.accentColorLabel")} value={draft.color_accent} onChange={(value) => set("color_accent", value)} />
        <ColorField label={t("settings.branding.sidebarColorLabel")} value={draft.color_sidebar} onChange={(value) => set("color_sidebar", value)} />
        <ColorField label={t("settings.branding.buttonColorLabel")} value={draft.color_button} onChange={(value) => set("color_button", value)} />
        <ColorField label={t("settings.branding.linkColorLabel")} value={draft.color_link} onChange={(value) => set("color_link", value)} />
      </div>

      {(sidebarContrastLow || buttonContrastLow) && (
        <div className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span>{t("settings.branding.lowContrastWarningTitle")}</span>
          {sidebarContrastLow && <span>{t("settings.branding.sidebarContrastWarning")}</span>}
          {buttonContrastLow && <span>{t("settings.branding.buttonContrastWarning")}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          {t("settings.branding.headingFontLabel")}
          <input value={draft.font_heading} onChange={(event) => set("font_heading", event.target.value)} className={FIELD_CLASS} />
        </label>
        <label className={LABEL_CLASS}>
          {t("settings.branding.bodyFontLabel")}
          <input value={draft.font_body} onChange={(event) => set("font_body", event.target.value)} className={FIELD_CLASS} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          {t("settings.branding.radiusLabel")}
          <select value={draft.radius} onChange={(event) => set("radius", event.target.value as BrandingRadius)} className={FIELD_CLASS}>
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          {t("settings.branding.themeModeLabel")}
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("settings.branding.livePreviewLabel")}</span>
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
              {t("settings.branding.activeBadge")}
            </span>
          </div>
          <p className="text-sm text-foreground" style={{ fontFamily: draft.font_body }}>
            {t("settings.branding.previewText")}{" "}
            <a href="#" onClick={(event) => event.preventDefault()} style={{ color: draft.color_link }} className="underline">
              {t("settings.branding.previewLinkText")}
            </a>
            .
          </p>
          <button
            type="button"
            disabled
            className="w-fit px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: draft.color_button, borderRadius: RADIUS_PREVIEW[draft.radius] }}
          >
            {t("settings.branding.previewButtonText")}
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
          {t("settings.branding.savedNotice")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? t("settings.branding.saving") : t("settings.branding.saveButton")}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {t("settings.branding.cancelButton")}
        </button>
        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {t("settings.branding.restoreDefaultsButton")}
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
