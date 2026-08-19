"use client";

import { platformIcons } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { platformColors } from "@/lib/platform-colors";
import { usePlatformLabel } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";

interface PlatformPerformanceChartProps {
  data: Array<{ key: string; engagementRate: number }>;
}

export function PlatformPerformanceChart({ data }: PlatformPerformanceChartProps) {
  const t = useTranslations();
  const PLATFORM_LABEL = usePlatformLabel();
  const maxRate = Math.max(1, ...data.map((item) => item.engagementRate));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{t("performances.platformChart.title")}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground ">{t("performances.notEnoughData")}</p>
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
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted ">
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
