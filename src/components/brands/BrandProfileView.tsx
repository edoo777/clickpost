"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandAccountsSection } from "@/components/brands/BrandAccountsSection";
import { BrandProfileForm, type BrandProfileSection } from "@/components/brands/BrandProfileForm";
import { BrandThemesSection } from "@/components/brands/BrandThemesSection";
import { CompletenessBar } from "@/components/brands/CompletenessBar";
import { ConfigurationProgress } from "@/components/brands/ConfigurationProgress";
import { useAccountsSession } from "@/lib/accounts-store";
import { getBrandCompleteness } from "@/lib/brand-completeness";
import { getBrandConfigurationProgress } from "@/lib/brand-configuration-progress";
import { useBrandsSession } from "@/lib/brands-store";
import { useThemesSession } from "@/lib/themes-store";
import type { Brand } from "@/types/brand";

interface BrandProfileViewProps {
  brand: Brand;
}

type Tab = "identity" | "positioning" | "accounts" | "themes" | "editorial";

const TABS: { id: Tab; label: string }[] = [
  { id: "identity", label: "Identité" },
  { id: "positioning", label: "Positionnement" },
  { id: "accounts", label: "Comptes affiliés" },
  { id: "themes", label: "Thématiques" },
  { id: "editorial", label: "Préférences éditoriales" },
];

export function BrandProfileView({ brand }: BrandProfileViewProps) {
  const router = useRouter();
  const { canManageBrands, activeBrandId, setActiveBrandId, updateBrand, archiveBrand, restoreBrand, deleteBrand } =
    useBrandsSession();
  const { accounts } = useAccountsSession();
  const { themes } = useThemesSession();

  const [draft, setDraft] = useState(brand);
  const [isEditing, setIsEditing] = useState(false);
  const [initializedForId, setInitializedForId] = useState(brand.id);
  const [tab, setTab] = useState<Tab>("identity");

  if (initializedForId !== brand.id) {
    setInitializedForId(brand.id);
    setDraft(brand);
    setIsEditing(false);
  }

  const { percent } = getBrandCompleteness(draft);
  const progress = getBrandConfigurationProgress(brand, accounts, themes);
  const isActive = activeBrandId === brand.id;
  const isArchived = brand.status === "archived";

  function handleCancel() {
    setDraft(brand);
    setIsEditing(false);
  }

  function handleSave() {
    updateBrand(brand.id, draft);
    setIsEditing(false);
  }

  function handleArchive() {
    if (
      window.confirm(
        `Archiver la marque « ${brand.name} » ? Elle restera consultable mais ne pourra plus être sélectionnée comme marque active.`
      )
    ) {
      archiveBrand(brand.id);
    }
  }

  function handleRestore() {
    restoreBrand(brand.id);
  }

  function handleDelete() {
    if (window.confirm(`Supprimer définitivement la marque « ${brand.name} » ? Cette action est irréversible.`)) {
      deleteBrand(brand.id);
      router.push("/marques");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground ">Profil de marque</span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">{draft.name}</h1>
          <p className="text-sm text-muted-foreground ">Niche : {draft.industry || "Non précisée"}</p>
          <div className="flex flex-wrap items-center gap-2">
            {isActive && (
              <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                Marque active
              </span>
            )}
            {isArchived && (
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Archivée
              </span>
            )}
          </div>
          <div className="w-64">
            <CompletenessBar percent={percent} />
          </div>
          <ConfigurationProgress steps={progress} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {!isActive && !isArchived && (
            <button
              type="button"
              onClick={() => setActiveBrandId(brand.id)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Définir comme marque active
            </button>
          )}

          {canManageBrands && !isEditing && (
            <>
              {isArchived ? (
                <button
                  type="button"
                  onClick={handleRestore}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-400 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                >
                  Restaurer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleArchive}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-zinc-400 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
                >
                  Archiver
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 dark:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10"
              >
                Supprimer
              </button>
            </>
          )}

          {canManageBrands &&
            (isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
                >
                  Enregistrer
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
              >
                Modifier
              </button>
            ))}
        </div>
      </div>

      {!canManageBrands && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          Votre rôle actuel permet uniquement de consulter cette marque — la création, la
          modification et l&apos;archivage sont réservés aux rôles Propriétaire et Administrateur du
          workspace.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1 w-fit">
        {TABS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === option.id
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "text-muted-foreground hover:text-foreground "
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {(tab === "identity" || tab === "positioning" || tab === "editorial") && (
        <BrandProfileForm profile={draft} editable={isEditing} onChange={setDraft} section={tab as BrandProfileSection} />
      )}
      {tab === "accounts" && <BrandAccountsSection brand={brand} canManage={canManageBrands} />}
      {tab === "themes" && <BrandThemesSection brand={brand} canManage={canManageBrands} />}
    </div>
  );
}
