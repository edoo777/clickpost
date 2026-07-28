"use client";

import { useState } from "react";
import { brandProfiles } from "@/lib/brand-profiles";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200";

export interface NewAccountInput {
  brand: string;
  platform: SocialPlatform;
  accountName: string;
  handle: string;
}

interface AddAccountPanelProps {
  onClose: () => void;
  onConnect: (input: NewAccountInput) => void;
}

export function AddAccountPanel({ onClose, onConnect }: AddAccountPanelProps) {
  const [brand, setBrand] = useState(brandProfiles[0]?.name ?? "");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [accountName, setAccountName] = useState("");
  const [handle, setHandle] = useState("");

  function handleSubmit() {
    onConnect({
      brand,
      platform,
      accountName: accountName.trim() || brand,
      handle: handle.trim() || "@nouveau-compte",
    });
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
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Ajouter un compte</h2>
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
          Connexion simulée — aucune authentification réelle n&apos;est effectuée.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Marque
            <select value={brand} onChange={(event) => setBrand(event.target.value)} className={INPUT_CLASS}>
              {brandProfiles.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Réseau
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
              className={INPUT_CLASS}
            >
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom du compte
            <input
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder={brand}
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Identifiant
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@identifiant"
              className={INPUT_CLASS}
            />
          </label>
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
            Connecter
          </button>
        </div>
      </div>
    </div>
  );
}
