"use client";

import { platformIcons } from "@/components/icons";
import { ACCOUNT_STATUS_DOT, ACCOUNT_STATUS_LABEL } from "@/lib/account-status";
import { useAccountsSession } from "@/lib/accounts-store";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function ConnectedAccounts() {
  const t = useTranslations();
  const { accounts } = useAccountsSession();

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <h2 className="mb-4 text-sm font-semibold text-foreground ">
        {t("dashboard.connectedAccountsTitle")}
      </h2>
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.connectedAccountsEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {accounts.map((account) => {
            const Icon = platformIcons[account.platform];
            return (
              <li key={account.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                  <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground ">
                    {account.handle}
                  </span>
                  <span className="truncate text-xs text-muted-foreground ">
                    {account.brand}
                  </span>
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${ACCOUNT_STATUS_DOT[account.status]}`}
                  title={ACCOUNT_STATUS_LABEL[account.status]}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
