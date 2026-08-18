"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_CURRENT_USER_ID, TEAM_MEMBERS } from "@/lib/team-data";
import { usePersistedState } from "@/lib/persistence/use-persisted-state";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
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

/**
 * L'équipe reste aujourd'hui un annuaire local (non relié à Supabase — voir
 * docs/remaining-before-beta.md). En production, on ne laisse jamais un utilisateur "devenir"
 * n'importe quel membre via un sélecteur manuel : on fait correspondre automatiquement son
 * adresse e-mail réelle (session Supabase) à un membre de l'annuaire pour dériver son identité.
 * Le sélecteur manuel reste disponible en développement uniquement (voir Sidebar.tsx) pour tester
 * les différents rôles sans compte réel par membre.
 */
export function TeamSessionProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = usePersistedState("teamMembers", TEAM_MEMBERS);
  const [currentUserId, setCurrentUserId] = usePersistedState("currentUserId", DEFAULT_CURRENT_USER_ID);
  const { email } = useWorkspaceSession();

  useEffect(() => {
    if (!email) return;
    const matchingMember = members.find((member) => member.email.toLowerCase() === email.toLowerCase());
    if (matchingMember && matchingMember.id !== currentUserId) {
      setCurrentUserId(matchingMember.id);
    }
    // Ne dépend volontairement que de l'e-mail réel : évite de ré-écraser un choix de
    // développement dès que l'annuaire local change (ex. ajout d'un membre).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

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
    [members, currentUserId, setMembers, setCurrentUserId]
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
