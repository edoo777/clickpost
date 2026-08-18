"use client";

import { useState } from "react";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

const REPURPOSE_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"];

export interface RepurposeChoice {
  platform: SocialPlatform;
  format: ContentFormat;
}

interface RepurposeContentModalProps {
  sourceTitle: string;
  sourcePlatform: SocialPlatform;
  sourceFormat: ContentFormat;
  onCancel: () => void;
  onConfirm: (choice: RepurposeChoice) => void;
}

/**
 * "Réutiliser ce contenu" — Chantier promotion/diffusion/repurposing. Ne génère jamais la
 * variante elle-même ici : crée une nouvelle idée liée au contenu d'origine (voir
 * `derivedFromId`, src/lib/develop-idea.ts), pré-remplie avec le texte source et la
 * plateforme/format choisis, puis ouvre l'Atelier existant — où raccourcir/développer/refaire le
 * hook/générer une variante sont déjà des actions réelles (presets Atelier), jamais dupliquées
 * ici.
 */
export function RepurposeContentModal({ sourceTitle, sourcePlatform, sourceFormat, onCancel, onConfirm }: RepurposeContentModalProps) {
  const [platform, setPlatform] = useState<SocialPlatform>(sourcePlatform);
  const [format, setFormat] = useState<ContentFormat>(sourceFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-label="Réutiliser ce contenu">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl">
        <h2 className="text-base font-semibold text-foreground">Réutiliser ce contenu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crée une nouvelle idée liée à « {sourceTitle} », prête à adapter dans l&apos;Atelier (raccourcir, développer,
          refaire le hook, générer une variante).
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nouvelle plateforme
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 dark:bg-transparent dark:text-zinc-200"
            >
              {REPURPOSE_PLATFORMS.map((option) => (
                <option key={option} value={option}>
                  {PLATFORM_LABEL[option]}
                  {option === sourcePlatform ? " (identique à l'original)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nouveau format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as ContentFormat)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 dark:bg-transparent dark:text-zinc-200"
            >
              {CONTENT_FORMATS.map((option) => (
                <option key={option} value={option}>
                  {FORMAT_LABEL[option]}
                  {option === sourceFormat ? " (identique à l'original)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-muted dark:text-zinc-400"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ platform, format })}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
          >
            Créer le contenu dérivé
          </button>
        </div>
      </div>
    </div>
  );
}
