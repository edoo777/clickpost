"use client";

import { useState } from "react";
import { ROLE_LABEL } from "@/lib/team-data";
import type { TeamRole } from "@/types/team";

const ALL_ROLES: TeamRole[] = ["owner", "admin", "manager", "creator", "reviewer", "client_approver"];
const ALL_BRANDS = ["Nova Cosmetics", "Atlas Consulting", "Le Comptoir Bio"];

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200";

export interface NewMemberInput {
  name: string;
  email: string;
  role: TeamRole;
  brands: string[];
}

interface InviteMemberPanelProps {
  onClose: () => void;
  onInvite: (input: NewMemberInput) => void;
}

export function InviteMemberPanel({ onClose, onInvite }: InviteMemberPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("creator");
  const [brands, setBrands] = useState<string[]>([]);

  function toggleBrand(brand: string) {
    setBrands((prev) => (prev.includes(brand) ? prev.filter((candidate) => candidate !== brand) : [...prev, brand]));
  }

  function handleSubmit() {
    if (name.trim().length === 0 || email.trim().length === 0) return;
    onInvite({ name: name.trim(), email: email.trim(), role, brands });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-white p-6 shadow-xl dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Inviter un membre</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Invitation simulée — aucun e-mail réel n&apos;est envoyé.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom
            <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rôle
            <select value={role} onChange={(event) => setRole(event.target.value as TeamRole)} className={INPUT_CLASS}>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Marques accessibles</span>
            <div className="flex flex-wrap gap-2">
              {ALL_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    brands.includes(brand)
                      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                      : "border-zinc-200 text-zinc-600 dark:border-white/[.08] dark:text-zinc-400"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-zinc-100 pt-4 dark:border-white/[.06]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            Envoyer l&apos;invitation (simulée)
          </button>
        </div>
      </div>
    </div>
  );
}
