"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountDetailPanel } from "@/components/accounts/AccountDetailPanel";
import {
  AccountsFilters,
  DEFAULT_ACCOUNTS_FILTERS,
  type AccountsFiltersValue,
} from "@/components/accounts/AccountsFilters";
import { AddAccountPanel, type NewAccountInput } from "@/components/accounts/AddAccountPanel";
import { SocialNetworksOverview } from "@/components/accounts/SocialNetworksOverview";
import { OAUTH_CALLBACK_PLATFORMS, describeOAuthCallbackError } from "@/lib/oauth-callback-messages";
import { useAccountsSession } from "@/lib/accounts-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePlatformLabel } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";

export function AccountsListView() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const PLATFORM_LABEL = usePlatformLabel();
  const { accounts, addAccount, updateAccount, removeAccount } = useAccountsSession();
  const { posts } = usePostsSession();
  const [filters, setFilters] = useState<AccountsFiltersValue>(DEFAULT_ACCOUNTS_FILTERS);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [callbackNotice, setCallbackNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      for (const platform of OAUTH_CALLBACK_PLATFORMS) {
        const errorCode = searchParams.get(`${platform}_error`);
        const connectedAccountId = searchParams.get(`${platform}_connected`);
        if (errorCode) {
          setCallbackNotice({ tone: "error", message: describeOAuthCallbackError(t, PLATFORM_LABEL[platform], errorCode, searchParams.get("ref")) });
          router.replace("/comptes");
          return;
        }
        if (connectedAccountId) {
          const count = Number(searchParams.get("count") ?? "1");
          setCallbackNotice({
            tone: "success",
            message:
              count > 1
                ? t("accounts.oauthCallback.connectedMultiple", { platform: PLATFORM_LABEL[platform], count })
                : t("accounts.oauthCallback.connected", { platform: PLATFORM_LABEL[platform] }),
          });
          setSelectedAccountId(connectedAccountId);
          router.replace("/comptes");
          return;
        }
      }
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  function handleSocialDisconnected(id: string) {
    updateAccount(id, {
      status: "profile_only",
      externalAccountId: undefined,
      oauthScopes: [],
      tokenExpiresAt: undefined,
    });
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">{t("pageHeader.accountsAffiliated")}</h1>
          <p className="text-sm text-muted-foreground ">
            {t("accounts.listView.accountsCountSummary", { count: filteredAccounts.length, plural: filteredAccounts.length > 1 ? "s" : "" })}
          </p>
        </header>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
        >
          {t("accounts.listView.addAccountButton")}
        </button>
      </div>

      {callbackNotice && (
        <div
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
            callbackNotice.tone === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          <span>{callbackNotice.message}</span>
          <button
            type="button"
            onClick={() => setCallbackNotice(null)}
            aria-label={t("accounts.oauthCallback.dismissAria")}
            className="shrink-0 text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            {t("accounts.oauthCallback.dismiss")}
          </button>
        </div>
      )}

      <SocialNetworksOverview accounts={accounts} onOpenAccount={setSelectedAccountId} onDisconnected={handleSocialDisconnected} />

      <AccountsFilters value={filters} onChange={setFilters} />

      {filteredAccounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          {t("accounts.listView.empty")}
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
          onSocialDisconnected={() => handleSocialDisconnected(selectedAccount.id)}
        />
      )}

      {isAddOpen && <AddAccountPanel onClose={() => setIsAddOpen(false)} onSave={handleSaveNew} />}
    </div>
  );
}
