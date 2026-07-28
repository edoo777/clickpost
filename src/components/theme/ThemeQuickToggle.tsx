"use client";

import { IconMoon, IconSun } from "@/components/icons";
import { useTheme } from "@/lib/theme-store";

interface ThemeQuickToggleProps {
  className?: string;
}

/** Bascule rapide clair/sombre (le tri-état complet, avec "Système", vit dans ThemeSelect). */
export function ThemeQuickToggle({ className }: ThemeQuickToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Passer en mode clair" : "Passer en mode sombre";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={className}
    >
      {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
    </button>
  );
}
