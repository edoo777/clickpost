"use client";

import { useState } from "react";
import { MANAGED_SOCIAL_PLATFORMS, SocialPlatformTile } from "@/components/accounts/SocialPlatformTile";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { SocialAccount } from "@/types/dashboard";

interface SocialNetworksOverviewProps {
  accounts: SocialAccount[];
  onOpenAccount: (accountId: string) => void;
  onDisconnected: (accountId: string) => void;
}

/**
 * Vue d'ensemble « Réseaux sociaux » — un seul endroit pour voir et gérer les six plateformes
 * réellement branchées (LinkedIn, Instagram, Facebook, TikTok, X, YouTube) pour une marque
 * donnée, sans devoir d'abord créer manuellement un compte "profil renseigné" pour chacune :
 * `/api/social/<plateforme>/connect` crée lui-même le compte affilié lors du retour OAuth. Une
 * marque à la fois (le flux de connexion OAuth exige un `brandId` précis, voir
 * `/api/social/<plateforme>/connect?brandId=...`).
 */
export function SocialNetworksOverview({ accounts, onOpenAccount, onDisconnected }: SocialNetworksOverviewProps) {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? "");
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? brands[0];

  if (!selectedBrand) return null;

  function accountFor(platform: (typeof MANAGED_SOCIAL_PLATFORMS)[number]) {
    return accounts.find(
      (account) =>
        account.platform === platform &&
        (selectedBrand && account.brandId ? account.brandId === selectedBrand.id : account.brand === selectedBrand?.name)
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground ">{t("accounts.socialNetworks.title")}</h2>
          <p className="text-xs text-muted-foreground ">{t("accounts.socialNetworks.description")}</p>
        </div>
        {brands.length > 1 && (
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("accounts.socialNetworks.brandLabel")}
            <select
              value={selectedBrand.id}
              onChange={(event) => setSelectedBrandId(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MANAGED_SOCIAL_PLATFORMS.map((platform) => (
          <SocialPlatformTile
            key={platform}
            platform={platform}
            brandId={selectedBrand.id}
            account={accountFor(platform)}
            onDisconnected={onDisconnected}
            onOpenDetails={onOpenAccount}
          />
        ))}
      </div>
    </section>
  );
}
