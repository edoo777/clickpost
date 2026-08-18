"use client";

import { ThemeSelect } from "@/components/theme/ThemeSelect";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function DisplayPreferencesSection() {
  const t = useTranslations();
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{t("settings.displayPreferences.title")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("settings.displayPreferences.description")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">{t("settings.displayPreferences.themeLabel")}</label>
        <ThemeSelect surface="light" />
      </div>
    </section>
  );
}
