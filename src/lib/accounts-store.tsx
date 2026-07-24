"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { connectedAccounts as demoAccounts } from "@/lib/demo-data";
import type { SocialAccount } from "@/types/dashboard";

interface AccountsSessionValue {
  accounts: SocialAccount[];
  addAccount: (account: SocialAccount) => void;
  updateAccount: (id: string, patch: Partial<SocialAccount>) => void;
  removeAccount: (id: string) => void;
}

const AccountsSessionContext = createContext<AccountsSessionValue | null>(null);

export function AccountsSessionProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(demoAccounts);

  const value = useMemo<AccountsSessionValue>(
    () => ({
      accounts,
      addAccount: (account) => setAccounts((prev) => [...prev, account]),
      updateAccount: (id, patch) =>
        setAccounts((prev) => prev.map((account) => (account.id === id ? { ...account, ...patch } : account))),
      removeAccount: (id) => setAccounts((prev) => prev.filter((account) => account.id !== id)),
    }),
    [accounts]
  );

  return <AccountsSessionContext.Provider value={value}>{children}</AccountsSessionContext.Provider>;
}

export function useAccountsSession() {
  const context = useContext(AccountsSessionContext);
  if (!context) {
    throw new Error("useAccountsSession must be used within an AccountsSessionProvider");
  }
  return context;
}
