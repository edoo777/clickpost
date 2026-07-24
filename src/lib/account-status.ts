import type { AccountStatus } from "@/types/dashboard";

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  connected: "Connecté",
  disconnected: "Déconnecté",
  expired: "Connexion expirée",
  error: "Erreur",
  syncing: "Synchronisation en cours",
};

export const ACCOUNT_STATUS_STYLE: Record<AccountStatus, string> = {
  connected: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  disconnected: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  expired: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  error: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  syncing: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

export const ACCOUNT_STATUS_DOT: Record<AccountStatus, string> = {
  connected: "bg-emerald-500",
  disconnected: "bg-zinc-400",
  expired: "bg-amber-500",
  error: "bg-red-500",
  syncing: "bg-blue-500",
};
