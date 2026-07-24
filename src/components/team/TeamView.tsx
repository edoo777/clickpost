"use client";

import { useState } from "react";
import { InviteMemberPanel, type NewMemberInput } from "@/components/team/InviteMemberPanel";
import { TeamTable } from "@/components/team/TeamTable";
import { useTeamSession } from "@/lib/team-store";
import type { TeamRole } from "@/types/team";

export function TeamView() {
  const { members, addMember, updateMember, removeMember } = useTeamSession();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function handleInvite(input: NewMemberInput) {
    addMember({
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      role: input.role,
      status: "active",
      brands: input.brands,
    });
    setIsInviteOpen(false);
    setConfirmation(`Invitation simulée envoyée à ${input.email}.`);
  }

  function handleUpdateRole(id: string, role: TeamRole) {
    updateMember(id, { role });
  }

  function handleToggleStatus(id: string) {
    const member = members.find((candidate) => candidate.id === id);
    if (!member) return;
    updateMember(id, { status: member.status === "active" ? "inactive" : "active" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Équipe</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {members.length} membre{members.length > 1 ? "s" : ""}
          </p>
        </header>
        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          + Inviter un membre
        </button>
      </div>

      {confirmation && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {confirmation}
        </p>
      )}

      <TeamTable
        members={members}
        onUpdateRole={handleUpdateRole}
        onToggleStatus={handleToggleStatus}
        onRemove={removeMember}
      />

      {isInviteOpen && <InviteMemberPanel onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} />}
    </div>
  );
}
