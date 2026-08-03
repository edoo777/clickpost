"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { useAccountsSession } from "@/lib/accounts-store";
import { getTopPublications } from "@/lib/analytics-report";
import { useBrandsSession } from "@/lib/brands-store";
import { buildDashboardPerformancePoints } from "@/lib/dashboard-performance";
import { isDemoAnalyticsEnabled } from "@/lib/demo-data-preference";
import { useImportedMetricsSession } from "@/lib/imported-metrics-store";
import { usePostsSession } from "@/lib/posts-store";

const numberFormatter = new Intl.NumberFormat("fr-FR");
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

interface TopPublicationsWidgetProps {
  filters?: DashboardFiltersValue;
}

export function TopPublicationsWidget({ filters = DEFAULT_DASHBOARD_FILTERS }: TopPublicationsWidgetProps) {
  const { posts } = usePostsSession();
  const { accounts } = useAccountsSession();
  const { brands } = useBrandsSession();
  const { importedMetrics } = useImportedMetricsSession();
  const demoEnabled = isDemoAnalyticsEnabled();
  const { perfFilters } = buildDashboardPerformancePoints(filters, accounts, brands, posts, importedMetrics, demoEnabled);

  const top = getTopPublications(posts, perfFilters, importedMetrics, demoEnabled, 8)
    .filter((publication) => filters.status === "all" || publication.status === filters.status)
    .filter((publication) => filters.format === "all" || publication.format === filters.format)
    .slice(0, 3);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <h2 className="text-sm font-semibold text-foreground ">Meilleures publications</h2>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Pas assez de données sur cette période.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
          {top.map((publication) => {
            const Icon = platformIcons[publication.platform];
            return (
              <li key={publication.id}>
                <Link
                  href={`/publications/${publication.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/10 dark:to-fuchsia-500/10">
                    <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground ">
                      {publication.excerpt || "Sans titre"}
                    </span>
                    <span className="text-xs text-muted-foreground ">
                      {publication.brand} · {dateFormatter.format(new Date(publication.scheduledFor))}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {publication.engagementRate.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground ">
                      {numberFormatter.format(publication.performance.reach)} vues
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
