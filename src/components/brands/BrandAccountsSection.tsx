"use client";

import { useState } from "react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountDetailPanel } from "@/components/accounts/AccountDetailPanel";
import { AddAccountPanel, type NewAccountInput } from "@/components/accounts/AddAccountPanel";
import { useAccountsSession } from "@/lib/accounts-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePostsSession } from "@/lib/posts-store";
import type { Brand } from "@/types/brand";
import type { SocialAccount } from "@/types/dashboard";

function accountBelongsToBrand(account: SocialAccount, brand: Brand): boolean {
  return account.brandId ? account.brandId === brand.id : account.brand === brand.name;
}

interface BrandAccountsSectionProps {
  brand: Brand;
  canManage: boolean;
}

/** Comptes affiliés intégrés à la fiche de marque — même store que la page /comptes globale
 * (useAccountsSession), simplement filtré sur cette marque. Aucun second système. */
export function BrandAccountsSection({ brand, canManage }: BrandAccountsSectionProps) {
  const t = useTranslations();
  const { accounts, addAccount, updateAccount, removeAccount } = useAccountsSession();
  const { posts } = usePostsSession();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const brandAccounts = accounts.filter((account) => accountBelongsToBrand(account, brand));
  const selectedAccount = brandAccounts.find((account) => account.id === selectedAccountId) ?? null;

  function getScheduledPostsCount(accountId: string) {
    return posts.filter((post) => post.accountId === accountId && post.status === "scheduled").length;
  }

  function handleSaveNew(input: NewAccountInput) {
    addAccount({
      id: crypto.randomUUID(),
      brand: input.brand,
      brandId: input.brandId,
      platform: input.platform,
      accountName: input.accountName,
      handle: input.handle,
      profileUrl: input.profileUrl || undefined,
      language: input.language || undefined,
      audienceOrMarket: input.audienceOrMarket || undefined,
      status: "profile_only",
      lastSyncedAt: null,
      permissions: [],
    });
    setIsAddOpen(false);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground ">{t("brands.accountsSection.title")}</h2>
          <p className="text-xs text-muted-foreground ">
            {t("brands.accountsSection.description", { name: brand.name })}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            {t("brands.accountsSection.addButton")}
          </button>
        )}
      </div>

      {brandAccounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          {t("brands.accountsSection.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {brandAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              scheduledPostsCount={getScheduledPostsCount(account.id)}
              onClick={() => setSelectedAccountId(account.id)}
            />
          ))}
        </div>
      )}

      {selectedAccount && (
        <AccountDetailPanel
          account={selectedAccount}
          scheduledPostsCount={getScheduledPostsCount(selectedAccount.id)}
          onClose={() => setSelectedAccountId(null)}
          onDeactivate={() => updateAccount(selectedAccount.id, { status: "disconnected" })}
          onReactivate={() => updateAccount(selectedAccount.id, { status: "profile_only" })}
          onDelete={() => {
            removeAccount(selectedAccount.id);
            setSelectedAccountId(null);
          }}
          onLinkedInDisconnected={() =>
            updateAccount(selectedAccount.id, {
              status: "profile_only",
              externalAccountId: undefined,
              oauthScopes: [],
              tokenExpiresAt: undefined,
            })
          }
        />
      )}

      {isAddOpen && <AddAccountPanel onClose={() => setIsAddOpen(false)} onSave={handleSaveNew} fixedBrand={brand} />}
    </section>
  );
}
