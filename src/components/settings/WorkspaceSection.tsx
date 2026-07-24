"use client";

import { useState } from "react";

interface WorkspaceSectionProps {
  brandsCount: number;
  membersCount: number;
  accountsCount: number;
}

export function WorkspaceSection({ brandsCount, membersCount, accountsCount }: WorkspaceSectionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Sécurité et organisation</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-zinc-400 dark:text-zinc-600">Forfait</span>
          <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Démonstration</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-zinc-400 dark:text-zinc-600">Marques</span>
          <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{brandsCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-zinc-400 dark:text-zinc-600">Membres</span>
          <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{membersCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-zinc-400 dark:text-zinc-600">Comptes connectés</span>
          <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{accountsCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-black/[.06] pt-4 dark:border-white/[.06]">
        {isDeleted ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            Suppression simulée — aucune donnée n&apos;a réellement été supprimée (démonstration).
          </p>
        ) : isConfirming ? (
          <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              Confirmer la suppression définitive de l&apos;espace de travail ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="flex-1 rounded-lg border border-black/[.08] px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirming(false);
                  setIsDeleted(true);
                }}
                className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            className="w-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Supprimer l&apos;espace de travail
          </button>
        )}
      </div>
    </section>
  );
}
