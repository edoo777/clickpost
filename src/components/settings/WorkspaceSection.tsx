"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";

interface WorkspaceSectionProps {
  brandsCount: number;
  membersCount: number;
  accountsCount: number;
}

export function WorkspaceSection({ brandsCount, membersCount, accountsCount }: WorkspaceSectionProps) {
  const t = useTranslations();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{t("settings.workspace.title")}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-muted-foreground ">{t("settings.workspace.planLabel")}</span>
          <span className="text-sm font-semibold text-foreground ">{t("settings.workspace.planValue")}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-muted-foreground ">{t("settings.workspace.brandsLabel")}</span>
          <span className="text-sm font-semibold text-foreground ">{brandsCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-muted-foreground ">{t("settings.workspace.membersLabel")}</span>
          <span className="text-sm font-semibold text-foreground ">{membersCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <span className="text-xs text-muted-foreground ">{t("settings.workspace.connectedAccountsLabel")}</span>
          <span className="text-sm font-semibold text-foreground ">{accountsCount}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4 ">
        {isDeleted ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {t("settings.workspace.deletedNotice")}
          </p>
        ) : isConfirming ? (
          <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              {t("settings.workspace.confirmDeleteTitle")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("settings.workspace.cancelButton")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirming(false);
                  setIsDeleted(true);
                }}
                className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                {t("settings.workspace.confirmDeleteButton")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            className="w-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            {t("settings.workspace.deleteWorkspaceButton")}
          </button>
        )}
      </div>
    </section>
  );
}
