"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { DEFAULT_APPROVAL_FILTERS, getApprovalQueue } from "@/lib/approval";
import { brandProfiles } from "@/lib/brand-profiles";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";

const MAX_ITEMS = 4;

interface NeedsActionWidgetProps {
  filters?: DashboardFiltersValue;
}

export function NeedsActionWidget({ filters = DEFAULT_DASHBOARD_FILTERS }: NeedsActionWidgetProps) {
  const { posts } = usePostsSession();
  const brandName = filters.brandId !== "all" ? brandProfiles.find((brand) => brand.id === filters.brandId)?.name : undefined;
  const queue = getApprovalQueue(posts, DEFAULT_APPROVAL_FILTERS)
    .filter((publication) => !brandName || publication.brand === brandName)
    .filter((publication) => filters.platform === "all" || publication.platform === filters.platform)
    .filter((publication) => filters.format === "all" || publication.format === filters.format)
    .slice(0, MAX_ITEMS);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Nécessite une action</h2>
        <Link href="/approbations" className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
          Voir tout
        </Link>
      </div>
      {queue.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Rien en attente pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-white/[.06]">
          {queue.map((publication) => {
            const Icon = platformIcons[publication.platform];
            return (
              <li key={publication.id}>
                <Link
                  href={`/publications/${publication.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                    <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {publication.excerpt || "Sans titre"}
                    </span>
                    <span className="truncate text-xs text-zinc-400 dark:text-zinc-600">{publication.brand}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[publication.status]}`}
                  >
                    {STATUS_LABEL[publication.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
