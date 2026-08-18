"use client";

import { useState } from "react";
import { useBrandsSession } from "@/lib/brands-store";
import { usePlatformLabel } from "@/lib/post-status";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "x",
  "threads",
  "pinterest",
  "other",
];

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

export interface NewAccountInput {
  brand: string;
  brandId?: string;
  platform: SocialPlatform;
  accountName: string;
  handle: string;
  profileUrl: string;
  language: string;
  audienceOrMarket: string;
}

interface AddAccountPanelProps {
  onClose: () => void;
  onSave: (input: NewAccountInput) => void;
  /** Fournie quand le panneau est ouvert depuis la fiche d'une marque — verrouille la marque et
   * masque le sélecteur, pour ne jamais permettre d'associer le compte à la mauvaise marque. */
  fixedBrand?: Brand;
}

export function AddAccountPanel({ onClose, onSave, fixedBrand }: AddAccountPanelProps) {
  const { brands } = useBrandsSession();
  const [brandId, setBrandId] = useState(fixedBrand?.id ?? brands[0]?.id ?? "");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [accountName, setAccountName] = useState("");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [audienceOrMarket, setAudienceOrMarket] = useState("");
  const PLATFORM_LABEL = usePlatformLabel();

  const selectedBrand = fixedBrand ?? brands.find((candidate) => candidate.id === brandId);

  function handleSubmit() {
    if (!selectedBrand) return;
    onSave({
      brand: selectedBrand.name,
      brandId: selectedBrand.id,
      platform,
      accountName: accountName.trim() || selectedBrand.name,
      handle: handle.trim(),
      profileUrl: profileUrl.trim(),
      language: language.trim(),
      audienceOrMarket: audienceOrMarket.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer le panneau" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground ">Ajouter un compte affilié</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
          Ceci enregistre uniquement les renseignements du profil — aucune connexion API/OAuth
          réelle n&apos;est établie. Le statut affichera « Profil renseigné — connexion API non
          configurée ».
        </p>

        <div className="flex flex-col gap-4">
          {fixedBrand ? (
            <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Marque
              <span className={`${INPUT_CLASS} text-muted-foreground`}>{fixedBrand.name}</span>
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Marque
              <select value={brandId} onChange={(event) => setBrandId(event.target.value)} className={INPUT_CLASS}>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Plateforme
            <select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)} className={INPUT_CLASS}>
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom d&apos;affichage
            <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder={selectedBrand?.name ?? ""} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Identifiant ou nom d&apos;utilisateur
            <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@identifiant" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            URL du profil (optionnel)
            <input value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} placeholder="https://…" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Langue (optionnel)
            <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="Français" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Audience ou marché (optionnel)
            <input value={audienceOrMarket} onChange={(event) => setAudienceOrMarket(event.target.value)} placeholder="Ex. Québec, 25-45 ans" className={INPUT_CLASS} />
          </label>
        </div>

        <div className="mt-auto flex gap-3 border-t border-border pt-4 ">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedBrand}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enregistrer le profil
          </button>
        </div>
      </div>
    </div>
  );
}
