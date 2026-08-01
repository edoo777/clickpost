"use client";

import { useMemo, useState } from "react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountDetailPanel } from "@/components/accounts/AccountDetailPanel";
import {
  AccountsFilters,
  DEFAULT_ACCOUNTS_FILTERS,
  type AccountsFiltersValue,
} from "@/components/accounts/AccountsFilters";
import { AddAccountPanel, type NewAccountInput } from "@/components/accounts/AddAccountPanel";
import { useAccountsSession } from "@/lib/accounts-store";
import { usePostsSession } from "@/lib/posts-store";

export function AccountsListView() {
  const { accounts, addAccount, updateAccount, removeAccount } = useAccountsSession();
  const { posts } = usePostsSession();
  const [filters, setFilters] = useState<AccountsFiltersValue>(DEFAULT_ACCOUNTS_FILTERS);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (filters.brand !== "all" && account.brand !== filters.brand) return false;
      if (filters.platform !== "all" && account.platform !== filters.platform) return false;
      if (filters.status !== "all" && account.status !== filters.status) return false;
      return true;
    });
  }, [accounts, filters]);

  function getScheduledPostsCount(accountId: string) {
    return posts.filter((post) => post.accountId === accountId && post.status === "scheduled").length;
  }

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;

  function handleDeactivate(id: string) {
    updateAccount(id, { status: "disconnected" });
  }

  function handleReactivate(id: string) {
    updateAccount(id, { status: "profile_only" });
  }

  function handleDelete(id: string) {
    removeAccount(id);
    setSelectedAccountId(null);
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">Comptes affiliés</h1>
          <p className="text-sm text-muted-foreground ">
            {filteredAccounts.length} compte{filteredAccounts.length > 1 ? "s" : ""} affiché
            {filteredAccounts.length > 1 ? "s" : ""} — profils enregistrés localement, aucune
            connexion API réelle configurée.
          </p>
        </header>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
        >
          + Ajouter un compte
        </button>
      </div>

      <AccountsFilters value={filters} onChange={setFilters} />

      {filteredAccounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          Aucun compte ne correspond à ces critères.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
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
          onDeactivate={() => handleDeactivate(selectedAccount.id)}
          onReactivate={() => handleReactivate(selectedAccount.id)}
          onDelete={() => handleDelete(selectedAccount.id)}
        />
      )}

      {isAddOpen && <AddAccountPanel onClose={() => setIsAddOpen(false)} onSave={handleSaveNew} />}
    </div>
  );
}
