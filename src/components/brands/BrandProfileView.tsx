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
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
              >
                Enregistrer
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
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
