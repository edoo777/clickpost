"use client";

import { IconMonitor, IconMoon, IconSun } from "@/components/icons";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import { useTheme, type Theme } from "@/lib/theme-store";

const OPTION_KEYS: { value: Theme; labelKey: TranslationKey; icon: typeof IconSun }[] = [
  { value: "light", labelKey: "settings.branding.themeModeOptions.light", icon: IconSun },
  { value: "dark", labelKey: "settings.branding.themeModeOptions.dark", icon: IconMoon },
  { value: "system", labelKey: "settings.branding.themeModeOptions.system", icon: IconMonitor },
];

interface ThemeSelectProps {
  /** Surface sur laquelle le contrôle est posé, pour adapter les couleurs à l'état inactif. */
  surface?: "light" | "dark";
}

export function ThemeSelect({ surface = "light" }: ThemeSelectProps) {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const onDarkSurface = surface === "dark";

  return (
    <div
      role="radiogroup"
      aria-label={t("themeSelect.ariaLabel")}
      className={`flex items-center gap-1 rounded-full p-1 ${onDarkSurface ? "bg-white/[.06]" : "bg-muted"}`}
    >
      {OPTION_KEYS.map(({ value, labelKey, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none transition-all ${
              isActive
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-white shadow-sm shadow-fuchsia-500/30"
                : onDarkSurface
                  ? "font-medium text-white/50 hover:text-white"
                  : "font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
