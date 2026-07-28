import { IconArrowDown, IconArrowUp } from "@/components/icons";

interface KpiCardProps {
  label: string;
  value: string;
  deltaPercent?: number | null;
}

export function KpiCard({ label, value, deltaPercent }: KpiCardProps) {
  const hasDelta = deltaPercent !== null && deltaPercent !== undefined;
  const isPositive = (deltaPercent ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5  ">
      <span className="text-sm text-muted-foreground ">{label}</span>
      <span className="text-2xl font-semibold text-foreground ">{value}</span>
      {hasDelta && (
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {isPositive ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
          {Math.abs(deltaPercent as number).toFixed(1)}% vs période précédente
        </span>
      )}
    </div>
  );
}
