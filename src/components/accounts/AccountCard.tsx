import { platformIcons } from "@/components/icons";
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_STYLE } from "@/lib/account-status";
import type { SocialAccount } from "@/types/dashboard";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface AccountCardProps {
  account: SocialAccount;
  scheduledPostsCount: number;
  onClick: () => void;
}

export function AccountCard({ account, scheduledPostsCount, onClick }: AccountCardProps) {
  const Icon = platformIcons[account.platform];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-400 dark:border-white/[.08] dark:bg-zinc-950 dark:hover:border-white/[.16]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {account.accountName}
            </span>
            <span className="truncate text-xs text-zinc-400 dark:text-zinc-600">{account.handle}</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ACCOUNT_STATUS_STYLE[account.status]}`}
        >
          {ACCOUNT_STATUS_LABEL[account.status]}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600">
        <span>{account.brand}</span>
        <span>
          {account.lastSyncedAt
            ? `Synchro. ${dateFormatter.format(new Date(account.lastSyncedAt))}`
            : "Jamais synchronisé"}
        </span>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {scheduledPostsCount} publication{scheduledPostsCount > 1 ? "s" : ""} programmée
        {scheduledPostsCount > 1 ? "s" : ""}
      </p>
    </button>
  );
}
