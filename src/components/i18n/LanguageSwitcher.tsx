"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { SUPPORTED_LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n/locale";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

/**
 * Sélecteur FR/EN — change la langue immédiatement (contexte + cookie, voir locale-provider.tsx)
 * et, pour un utilisateur authentifié, persiste le choix sur `profiles.ui_locale` pour qu'il
 * survive à une reconnexion sur un autre appareil (voir LocaleProfileSync.tsx pour le sens
 * inverse). Utilisable partout : landing page, pages d'authentification, tableau de bord.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  const { userId, updateProfile } = useWorkspaceSession();

  function handleChange(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    if (userId) void updateProfile({ ui_locale: next });
  }

  return (
    <div
      role="group"
      aria-label={t("common.languageSwitcherLabel")}
      className={`inline-flex items-center rounded-lg border border-border bg-surface p-0.5 text-xs font-medium ${compact ? "" : ""}`}
    >
      {SUPPORTED_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleChange(option)}
          aria-pressed={locale === option}
          className={`rounded-md px-2.5 py-0.5 leading-tight transition-colors ${
            locale === option
              ? "bg-violet-600 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {compact ? option.toUpperCase() : LOCALE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
