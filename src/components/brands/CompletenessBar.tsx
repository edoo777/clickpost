"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";

function getFillColor(percent: number): string {
  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-red-400";
}

interface CompletenessBarProps {
  percent: number;
  label?: string;
}

export function CompletenessBar({ percent, label }: CompletenessBarProps) {
  const t = useTranslations();
  const resolvedLabel = label ?? t("brands.completenessBar.defaultLabel");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground ">
        <span>{resolvedLabel}</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted ">
        <div
          className={`h-full rounded-full transition-[width] ${getFillColor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
