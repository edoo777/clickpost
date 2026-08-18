import type { ComponentType, SVGProps } from "react";
import { IconArrowDown, IconArrowUp } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { PerformanceMetric } from "@/types/dashboard";

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 64;
  const height = 24;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-16 shrink-0" role="img" aria-hidden="true">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={positive ? "text-emerald-500" : "text-red-500"}
      />
    </svg>
  );
}

interface StatCardProps extends PerformanceMetric {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accentClass: string;
  trend?: number[];
}

export function StatCard({ label, value, change, icon: Icon, accentClass, trend }: StatCardProps) {
  const t = useTranslations();
  const isPositive = change >= 0;

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10  ">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-70 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        {trend && trend.length > 1 && <Sparkline values={trend} positive={isPositive} />}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground ">{label}</span>
        <span className="text-2xl font-semibold tracking-tight text-foreground ">{value}</span>
      </div>
      <span
        className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isPositive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        }`}
      >
        {isPositive ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
        {Math.abs(change)}% {t("dashboard.metricChangeSuffix")}
      </span>
    </div>
  );
}
