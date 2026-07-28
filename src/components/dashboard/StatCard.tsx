import { IconArrowDown, IconArrowUp } from "@/components/icons";
import type { PerformanceMetric } from "@/types/dashboard";

export function StatCard({ label, value, change }: PerformanceMetric) {
  const isPositive = change >= 0;

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10 dark:border-white/[.08] dark:bg-zinc-950">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-70 transition-opacity group-hover:opacity-100" />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{value}</span>
      <span
        className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isPositive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        }`}
      >
        {isPositive ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
        {Math.abs(change)}% vs période précédente
      </span>
    </div>
  );
}
