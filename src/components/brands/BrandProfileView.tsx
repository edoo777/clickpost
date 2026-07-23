"use client";

import { useState } from "react";
import { BrandProfileForm } from "@/components/brands/BrandProfileForm";
import { CompletenessBar } from "@/components/brands/CompletenessBar";
import { getBrandCompleteness } from "@/lib/brand-completeness";
import type { BrandProfile } from "@/types/brand";

interface BrandProfileViewProps {
  profile: BrandProfile;
}

export function BrandProfileView({ profile }: BrandProfileViewProps) {
  const [draft, setDraft] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);

  const { percent } = getBrandCompleteness(draft);

  function handleCancel() {
    setDraft(profile);
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
            Profil de marque
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {draft.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{draft.industry}</p>
          <div className="w-64">
            <CompletenessBar percent={percent} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                Enregistrer
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Les modifications restent en mémoire pour cette session uniquement — elles seront perdues
          au rechargement de la page.
        </p>
      )}

      <BrandProfileForm profile={draft} editable={isEditing} onChange={setDraft} />
    </div>
  );
}
