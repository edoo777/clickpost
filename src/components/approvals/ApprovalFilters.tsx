"use client";

import { brandProfiles } from "@/lib/brand-profiles";
import type { ApprovalFilters as ApprovalFiltersState } from "@/lib/approval";
import type { TeamMember } from "@/types/team";

const FIELD_CLASS =
  "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300";

interface ApprovalFiltersProps {
  value: ApprovalFiltersState;
  members: TeamMember[];
  onChange: (value: ApprovalFiltersState) => void;
}

export function ApprovalFilters({ value, members, onChange }: ApprovalFiltersProps) {
  const activeMembers = members.filter((member) => member.status === "active");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={value.brand}
        onChange={(event) => onChange({ ...value, brand: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">Toutes les marques</option>
        {brandProfiles.map((brand) => (
          <option key={brand.id} value={brand.name}>
            {brand.name}
          </option>
        ))}
      </select>

      <select
        value={value.owner}
        onChange={(event) => onChange({ ...value, owner: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">Tous les responsables</option>
        {activeMembers.map((member) => (
          <option key={member.id} value={member.name}>
            {member.name}
          </option>
        ))}
      </select>

      <select
        value={value.approver}
        onChange={(event) => onChange({ ...value, approver: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">Tous les approbateurs</option>
        {activeMembers.map((member) => (
          <option key={member.id} value={member.name}>
            {member.name}
          </option>
        ))}
      </select>

      <select
        value={value.status}
        onChange={(event) =>
          onChange({ ...value, status: event.target.value as ApprovalFiltersState["status"] })
        }
        className={FIELD_CLASS}
      >
        <option value="all">En révision + en attente du client</option>
        <option value="in_review">En révision</option>
        <option value="pending_client">En attente du client</option>
      </select>
    </div>
  );
}
