"use client";

import { useState } from "react";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

interface CreateBrandPanelProps {
  onClose: () => void;
  onCreate: (input: { name: string; industry: string; description: string }) => void;
}

export function CreateBrandPanel({ onClose, onCreate }: CreateBrandPanelProps) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({ name: name.trim(), industry: industry.trim(), description: description.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer le panneau" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground ">Créer une marque</h2>
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
          Le reste du profil (audience, ton, sujets, réseaux…) pourra être complété ensuite depuis la fiche de la marque.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom de la marque
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex. Atelier Nordique"
              className={INPUT_CLASS}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Secteur d&apos;activité
            <input
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="Ex. Mode & accessoires"
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={INPUT_CLASS}
            />
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
