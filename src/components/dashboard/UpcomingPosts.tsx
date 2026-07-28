"use client";

import { platformIcons } from "@/components/icons";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { brandProfiles } from "@/lib/brand-profiles";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";

const MAX_UPCOMING = 5;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface UpcomingPostsProps {
  filters?: DashboardFiltersValue;
}

export function UpcomingPosts({ filters = DEFAULT_DASHBOARD_FILTERS }: UpcomingPostsProps) {
  const { posts } = usePostsSession();
  const brandName = filters.brandId !== "all" ? brandProfiles.find((brand) => brand.id === filters.brandId)?.name : undefined;
  const now = new Date();
  const upcoming = posts
    .filter((post) => new Date(post.scheduledFor) >= now)
    .filter((post) => !brandName || post.brand === brandName)
    .filter((post) => filters.platform === "all" || post.platform === filters.platform)
    .filter((post) => filters.status === "all" || post.status === filters.status)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .slice(0, MAX_UPCOMING);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Publications à venir
      </h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Aucune publication à venir pour ces filtres.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-white/[.06]">
          {upcoming.map((post) => {
            const Icon = platformIcons[post.platform];
            return (
              <li key={post.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                  <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {post.excerpt}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {post.brand} · {dateFormatter.format(new Date(post.scheduledFor))}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[post.status]}`}
                >
                  {STATUS_LABEL[post.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
