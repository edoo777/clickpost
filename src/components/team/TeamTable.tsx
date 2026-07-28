"use client";

import { useState } from "react";
import { ROLE_LABEL, ROLE_STYLE } from "@/lib/team-data";
import type { TeamMember, TeamRole } from "@/types/team";

const ALL_ROLES: TeamRole[] = ["owner", "admin", "manager", "creator", "reviewer", "client_approver"];
const ALL_BRANDS = ["Nova Cosmetics", "Atlas Consulting", "Le Comptoir Bio"];

interface TeamTableProps {
  members: TeamMember[];
  onUpdateRole: (id: string, role: TeamRole) => void;
  onToggleStatus: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TeamTable({ members, onUpdateRole, onToggleStatus, onRemove }: TeamTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-white/[.08] dark:bg-zinc-950">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-white/[.06] dark:text-zinc-600">
            <th className="px-4 py-3">Membre</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3">Marques accessibles</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-white/[.06]">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-950 dark:text-zinc-50">{member.name}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">{member.email}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <select
                  value={member.role}
                  onChange={(event) => onUpdateRole(member.id, event.target.value as TeamRole)}
                  className={`rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium dark:border-white/[.08] ${ROLE_STYLE[member.role]}`}
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {member.brands.length === ALL_BRANDS.length ? (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Toutes les marques
                    </span>
                  ) : (
                    member.brands.map((brand) => (
                      <span
                        key={brand}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {brand}
                      </span>
                    ))
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onToggleStatus(member.id)}
                  aria-label={member.status === "active" ? "Désactiver" : "Activer"}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    member.status === "active" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      member.status === "active" ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                {confirmingId === member.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400">Confirmer ?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(member.id);
                        setConfirmingId(null);
                      }}
                      className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-white/[.08] dark:text-zinc-400"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(member.id)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Retirer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
