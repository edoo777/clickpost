"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import type { SocialAccount } from "@/types/dashboard";

interface AccountsSessionValue {
  accounts: SocialAccount[];
  addAccount: (account: SocialAccount) => void;
  updateAccount: (id: string, patch: Partial<SocialAccount>) => void;
  removeAccount: (id: string) => void;
}

const AccountsSessionContext = createContext<AccountsSessionValue | null>(null);

export function AccountsSessionProvider({ children }: { children: ReactNode }) {
  // Jamais de données de démonstration présentées comme réelles par défaut (voir brands-store.tsx
  // pour le même principe) — corrige un tableau de bord affichant de faux comptes connectés à un
  // nouvel utilisateur, trouvé lors d'un audit autonome (2026-08-17).
  const [accounts, setAccounts] = useSyncedPersistedState<"accounts">("accounts", [], "accounts");

  const value = useMemo<AccountsSessionValue>(
    () => ({
      accounts,
      addAccount: (account) => setAccounts((prev) => [...prev, account]),
      updateAccount: (id, patch) =>
        setAccounts((prev) => prev.map((account) => (account.id === id ? { ...account, ...patch } : account))),
      removeAccount: (id) => setAccounts((prev) => prev.filter((account) => account.id !== id)),
    }),
    [accounts, setAccounts]
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
