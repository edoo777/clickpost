import { platformIcons } from "@/components/icons";
import { platformColors } from "@/lib/platform-colors";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";

interface PlatformPerformanceChartProps {
  data: Array<{ key: string; engagementRate: number }>;
}

export function PlatformPerformanceChart({ data }: PlatformPerformanceChartProps) {
  const maxRate = Math.max(1, ...data.map((item) => item.engagementRate));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Performance par réseau</h2>
      {data.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Pas assez de données sur cette période.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item) => {
            const platform = item.key as SocialPlatform;
            const Icon = platformIcons[platform];
            const color = platformColors[platform];
            return (
              <div key={item.key} className="flex items-center gap-3">
                <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <Icon className="h-3.5 w-3.5" /> {PLATFORM_LABEL[platform]}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className={`h-full rounded-full ${color.dot}`}
                    style={{ width: `${(item.engagementRate / maxRate) * 100}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {item.engagementRate.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
