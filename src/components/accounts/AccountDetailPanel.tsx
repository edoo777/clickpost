"use client";

import { useState } from "react";
import { platformIcons } from "@/components/icons";
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_STYLE } from "@/lib/account-status";
import { platformColors } from "@/lib/platform-colors";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialAccount } from "@/types/dashboard";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

interface AccountDetailPanelProps {
  account: SocialAccount;
  scheduledPostsCount: number;
  onClose: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}

export function AccountDetailPanel({
  account,
  scheduledPostsCount,
  onClose,
  onReconnect,
  onDisconnect,
  onDelete,
}: AccountDetailPanelProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const color = platformColors[account.platform];
  const Icon = platformIcons[account.platform];
  const canReconnect = ["disconnected", "expired", "error"].includes(account.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${color.bg}`}>
              <Icon className={`h-4 w-4 ${color.text}`} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground ">
                {PLATFORM_LABEL[account.platform]}
              </span>
              <span className="text-xs text-muted-foreground ">{account.brand}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${ACCOUNT_STATUS_STYLE[account.status]}`}
        >
          {ACCOUNT_STATUS_LABEL[account.status]}
        </span>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground ">{account.accountName}</h2>
          <p className="text-sm text-muted-foreground ">{account.handle}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-muted-foreground ">
          <div>
            <dt className="font-medium text-muted-foreground ">Dernière synchronisation</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">
              {account.lastSyncedAt ? dateFormatter.format(new Date(account.lastSyncedAt)) : "Jamais"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground ">Publications programmées</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{scheduledPostsCount}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground ">
            Permissions disponibles
          </span>
          {account.permissions.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {account.permissions.map((permission) => (
                <li
                  key={permission}
                  className="rounded-lg bg-muted px-3 py-1.5 text-xs text-zinc-600  dark:text-zinc-400"
                >
                  {permission}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground ">Aucune permission active.</p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 ">
          {isConfirmingDelete ? (
            <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                Supprimer définitivement ce compte de la session ?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {canReconnect ? (
                <button
                  type="button"
                  onClick={onReconnect}
                  className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
                >
                  Reconnecter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  Déconnecter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50  dark:hover:bg-red-500/10"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
