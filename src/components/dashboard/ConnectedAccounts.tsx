import { platformIcons } from "@/components/icons";
import { connectedAccounts } from "@/lib/demo-data";

export function ConnectedAccounts() {
  return (
    <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Comptes sociaux connectés
      </h2>
      <ul className="flex flex-col gap-3">
        {connectedAccounts.map((account) => {
          const Icon = platformIcons[account.platform];
          const isConnected = account.status === "connected";
          return (
            <li key={account.id} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {account.handle}
                </span>
                <span className="truncate text-xs text-zinc-400 dark:text-zinc-600">
                  {account.brand}
                </span>
              </div>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
                title={isConnected ? "Connecté" : "Reconnexion requise"}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
