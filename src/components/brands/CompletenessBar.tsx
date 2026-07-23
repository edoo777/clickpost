function getFillColor(percent: number): string {
  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-red-400";
}

interface CompletenessBarProps {
  percent: number;
  label?: string;
}

export function CompletenessBar({ percent, label = "Profil complet" }: CompletenessBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{label}</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-[width] ${getFillColor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
