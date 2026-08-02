"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import { nextOrder } from "@/lib/themes";
import { themes as SEED_THEMES } from "@/lib/themes-data";
import type { Weekday } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

export interface ThemeDraft {
  label?: string;
  objective?: string;
  description?: string;
  keywords?: string[];
}

interface ThemesSessionValue {
  themes: Theme[];
  /** Retourne l'id de la thématique créée — permet à un appelant (ex. thématique ponctuelle du
   * Générateur d'idées) de basculer immédiatement une sélection ad hoc vers une thématique réelle
   * après confirmation explicite de l'utilisateur. */
  addTheme: (brandId: string, draft?: ThemeDraft) => string;
  updateTheme: (id: string, patch: Partial<Theme>) => void;
  toggleThemeActive: (id: string) => void;
  toggleThemeWeekday: (id: string, day: Weekday) => void;
  moveTheme: (id: string, direction: "up" | "down") => void;
  removeTheme: (id: string) => void;
}

const ThemesSessionContext = createContext<ThemesSessionValue | null>(null);

export function ThemesSessionProvider({ children }: { children: ReactNode }) {
  const [themes, setThemes] = useSyncedPersistedState("themes", SEED_THEMES, "themes");

  const value = useMemo<ThemesSessionValue>(
    () => ({
      themes,
      addTheme: (brandId, draft) => {
        const id = crypto.randomUUID();
        setThemes((prev) => [
          ...prev,
          {
            id,
            brandId,
            label: draft?.label ?? "",
            objective: draft?.objective ?? "",
            description: draft?.description,
            keywords: draft?.keywords,
            weekdays: [],
            order: nextOrder(prev, brandId),
            active: true,
            createdAt: new Date().toISOString(),
          },
        ]);
        return id;
      },
      updateTheme: (id, patch) =>
        setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, ...patch } : theme))),
      toggleThemeActive: (id) =>
        setThemes((prev) =>
          prev.map((theme) => (theme.id === id ? { ...theme, active: !theme.active } : theme))
        ),
      toggleThemeWeekday: (id, day) =>
        setThemes((prev) =>
          prev.map((theme) =>
            theme.id === id
              ? {
                  ...theme,
                  weekdays: theme.weekdays.includes(day)
                    ? theme.weekdays.filter((d) => d !== day)
                    : [...theme.weekdays, day],
                }
              : theme
          )
        ),
      moveTheme: (id, direction) =>
        setThemes((prev) => {
          const theme = prev.find((t) => t.id === id);
          if (!theme) return prev;
          const siblings = prev
            .filter((t) => t.brandId === theme.brandId)
            .sort((a, b) => a.order - b.order);
          const index = siblings.findIndex((t) => t.id === id);
          const swapIndex = direction === "up" ? index - 1 : index + 1;
          if (swapIndex < 0 || swapIndex >= siblings.length) return prev;
          const sibling = siblings[swapIndex];
          return prev.map((t) => {
            if (t.id === theme.id) return { ...t, order: sibling.order };
            if (t.id === sibling.id) return { ...t, order: theme.order };
            return t;
          });
        }),
      removeTheme: (id) => setThemes((prev) => prev.filter((theme) => theme.id !== id)),
    }),
    [themes, setThemes]
  );

  return <ThemesSessionContext.Provider value={value}>{children}</ThemesSessionContext.Provider>;
}

export function useThemesSession() {
  const context = useContext(ThemesSessionContext);
  if (!context) {
    throw new Error("useThemesSession must be used within a ThemesSessionProvider");
  }
  return context;
}
