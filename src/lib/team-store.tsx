"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_CURRENT_USER_ID, TEAM_MEMBERS } from "@/lib/team-data";
import type { TeamMember } from "@/types/team";

interface TeamSessionValue {
  members: TeamMember[];
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, patch: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
}

const TeamSessionContext = createContext<TeamSessionValue | null>(null);

export function TeamSessionProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_CURRENT_USER_ID);

  const value = useMemo<TeamSessionValue>(
    () => ({
      members,
      addMember: (member) => setMembers((prev) => [...prev, member]),
      updateMember: (id, patch) =>
        setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...patch } : member))),
      removeMember: (id) => setMembers((prev) => prev.filter((member) => member.id !== id)),
      currentUserId,
      setCurrentUserId,
    }),
    [members, currentUserId]
  );

  return <TeamSessionContext.Provider value={value}>{children}</TeamSessionContext.Provider>;
}

export function useTeamSession() {
  const context = useContext(TeamSessionContext);
  if (!context) {
    throw new Error("useTeamSession must be used within a TeamSessionProvider");
  }
  return context;
}
