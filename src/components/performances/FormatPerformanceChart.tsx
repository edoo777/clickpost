"use client";

import { useFormatLabel } from "@/lib/editorial-constants";
import type { ContentFormat } from "@/types/editorial-calendar";

interface FormatPerformanceChartProps {
  data: Array<{ key: string; engagementRate: number }>;
}

export function FormatPerformanceChart({ data }: FormatPerformanceChartProps) {
  const FORMAT_LABEL = useFormatLabel();
  const maxRate = Math.max(1, ...data.map((item) => item.engagementRate));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">Formats les plus performants</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Pas assez de données sur cette période.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {FORMAT_LABEL[item.key as ContentFormat] ?? item.key}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted ">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(item.engagementRate / maxRate) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {item.engagementRate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
