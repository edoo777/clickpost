"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_AGENCY_SETTINGS } from "@/lib/settings-data";
import type { UserProfileExtra } from "@/types/user-profile";

function buildDefaultProfile(memberId: string, fallbackName: string): UserProfileExtra {
  const [firstName, ...rest] = fallbackName.trim().split(" ").filter(Boolean);
  return {
    memberId,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    company: DEFAULT_AGENCY_SETTINGS.info.name,
    timeZone: DEFAULT_AGENCY_SETTINGS.info.defaultTimeZone,
    language: DEFAULT_AGENCY_SETTINGS.info.defaultLanguage,
    country: DEFAULT_AGENCY_SETTINGS.info.country,
    phone: "",
    bio: "",
    notifications: { ...DEFAULT_AGENCY_SETTINGS.notifications },
    displayDensity: "comfortable",
    theme: "system",
  };
}

interface UserProfileSessionValue {
  getProfile: (memberId: string, fallbackName?: string) => UserProfileExtra;
  updateProfile: (memberId: string, patch: Partial<UserProfileExtra>) => void;
}

const UserProfileSessionContext = createContext<UserProfileSessionValue | null>(null);

export function UserProfileSessionProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, UserProfileExtra>>({});

  const value = useMemo<UserProfileSessionValue>(
    () => ({
      getProfile: (memberId, fallbackName = "") => profiles[memberId] ?? buildDefaultProfile(memberId, fallbackName),
      updateProfile: (memberId, patch) =>
        setProfiles((prev) => ({
          ...prev,
          [memberId]: { ...(prev[memberId] ?? buildDefaultProfile(memberId, "")), ...patch },
        })),
    }),
    [profiles]
  );

  return <UserProfileSessionContext.Provider value={value}>{children}</UserProfileSessionContext.Provider>;
}

export function useUserProfileSession() {
  const context = useContext(UserProfileSessionContext);
  if (!context) {
    throw new Error("useUserProfileSession must be used within a UserProfileSessionProvider");
  }
  return context;
}
