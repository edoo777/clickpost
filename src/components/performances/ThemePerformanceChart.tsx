interface ThemePerformanceChartProps {
  data: Array<{ key: string; label: string; engagementRate: number }>;
}

export function ThemePerformanceChart({ data }: ThemePerformanceChartProps) {
  const maxRate = Math.max(1, ...data.map((item) => item.engagementRate));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Thématiques les plus performantes</h2>
      {data.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Pas assez de données sur cette période.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {item.label}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
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
