"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_AGENCY_SETTINGS } from "@/lib/settings-data";
import type { AgencySettings } from "@/types/settings";

interface SettingsSessionValue {
  settings: AgencySettings;
  setSettings: (next: AgencySettings) => void;
}

const SettingsSessionContext = createContext<SettingsSessionValue | null>(null);

export function SettingsSessionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_AGENCY_SETTINGS);

  const value = useMemo<SettingsSessionValue>(() => ({ settings, setSettings }), [settings]);

  return <SettingsSessionContext.Provider value={value}>{children}</SettingsSessionContext.Provider>;
}

export function useSettingsSession() {
  const context = useContext(SettingsSessionContext);
  if (!context) {
    throw new Error("useSettingsSession must be used within a SettingsSessionProvider");
  }
  return context;
}
