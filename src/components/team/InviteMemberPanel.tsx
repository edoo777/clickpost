"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useRoleLabel } from "@/lib/team-data";
import type { TeamRole } from "@/types/team";

const ALL_ROLES: TeamRole[] = ["owner", "admin", "manager", "creator", "reviewer", "client_approver"];
const ALL_BRANDS = ["Nova Cosmetics", "Atlas Consulting", "Le Comptoir Bio"];

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

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
  const t = useTranslations();
  const ROLE_LABEL = useRoleLabel();
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
        aria-label={t("team.invitePanel.closePanel")}
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground ">{t("team.invitePanel.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("team.invitePanel.close")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {t("team.invitePanel.simulatedNotice")}
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("team.invitePanel.name")}
            <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("team.invitePanel.email")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("team.invitePanel.role")}
            <select value={role} onChange={(event) => setRole(event.target.value as TeamRole)} className={INPUT_CLASS}>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("team.invitePanel.accessibleBrands")}</span>
            <div className="flex flex-wrap gap-2">
              {ALL_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    brands.includes(brand)
                      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                      : "border-border text-zinc-600  dark:text-zinc-400"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-border pt-4 ">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {t("team.invitePanel.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            {t("team.invitePanel.sendInvitation")}
          </button>
        </div>
      </div>
    </div>
  );
}
