"use client";

import { useState } from "react";
import type { BrandDraft } from "@/lib/brands-store";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

interface CreateBrandPanelProps {
  onClose: () => void;
  onCreate: (input: BrandDraft) => void;
}

export function CreateBrandPanel({ onClose, onCreate }: CreateBrandPanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [positioning, setPositioning] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [language, setLanguage] = useState("");
  const [market, setMarket] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [colorPrimary, setColorPrimary] = useState("");

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      industry: industry.trim(),
      subNiche: subNiche.trim() || undefined,
      targetAudience: targetAudience.trim(),
      positioning: positioning.trim() || undefined,
      toneOfVoice: toneOfVoice.trim(),
      languages: language.trim() ? [language.trim()] : [],
      market: market.trim() || undefined,
      website: website.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      colorPrimary: colorPrimary.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer le panneau" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground ">Nouvelle marque</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-muted-foreground ">
          Seul le nom est obligatoire ici — les comptes affiliés et thématiques se configurent
          ensuite depuis la fiche de la marque.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom de la marque
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Studio Alto" className={INPUT_CLASS} autoFocus />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
            <textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Niche (secteur général)
            <input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Ex. Fitness" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Sous-niche (optionnel)
            <input value={subNiche} onChange={(event) => setSubNiche(event.target.value)} placeholder="Ex. Musculation à domicile" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Clientèle cible
            <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder="Ex. Professionnels 25-45 ans" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Proposition de valeur (optionnel)
            <textarea rows={2} value={positioning} onChange={(event) => setPositioning(event.target.value)} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ton de communication
            <input value={toneOfVoice} onChange={(event) => setToneOfVoice(event.target.value)} placeholder="Ex. Chaleureux et expert" className={INPUT_CLASS} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Langue
              <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="Français" className={INPUT_CLASS} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Pays / marché (optionnel)
              <input value={market} onChange={(event) => setMarket(event.target.value)} placeholder="Québec" className={INPUT_CLASS} />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Site Web (optionnel)
            <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://…" className={INPUT_CLASS} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Logo — URL (optionnel)
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://…" className={INPUT_CLASS} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Couleur de marque (optionnel)
              <input type="color" value={colorPrimary || "#7c3aed"} onChange={(event) => setColorPrimary(event.target.value)} className={`${INPUT_CLASS} h-10 p-1`} />
            </label>
          </div>
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
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Créer la marque
          </button>
        </div>
      </div>
    </div>
  );
}
