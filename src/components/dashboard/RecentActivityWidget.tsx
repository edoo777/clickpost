"use client";

import Link from "next/link";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { brandProfiles } from "@/lib/brand-profiles";
import { usePostsSession } from "@/lib/posts-store";

const MAX_ITEMS = 6;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface RecentActivityWidgetProps {
  filters?: DashboardFiltersValue;
}

interface ActivityRow {
  id: string;
  publicationId: string;
  publicationExcerpt: string;
  action: string;
  actorName: string;
  createdAt: string;
}

export function RecentActivityWidget({ filters = DEFAULT_DASHBOARD_FILTERS }: RecentActivityWidgetProps) {
  const { posts } = usePostsSession();
  const brandName = filters.brandId !== "all" ? brandProfiles.find((brand) => brand.id === filters.brandId)?.name : undefined;

  const filteredPosts = posts
    .filter((post) => !brandName || post.brand === brandName)
    .filter((post) => filters.platform === "all" || post.platform === filters.platform)
    .filter((post) => filters.status === "all" || post.status === filters.status)
    .filter((post) => filters.format === "all" || post.format === filters.format);

  const rows: ActivityRow[] = filteredPosts
    .flatMap((post) =>
      post.history.map((entry) => ({
        id: entry.id,
        publicationId: post.id,
        publicationExcerpt: post.excerpt || "Sans titre",
        action: entry.action,
        actorName: entry.actorName,
        createdAt: entry.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ITEMS);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <h2 className="text-sm font-semibold text-foreground ">Activité récente</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Aucune activité pour ces filtres.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600" />
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/publications/${row.publicationId}`}
                  className="truncate text-sm text-zinc-800 hover:underline dark:text-zinc-200"
                >
                  <span className="font-medium">{row.actorName || "Système"}</span> — {row.action}
                </Link>
                <span className="text-xs text-muted-foreground ">
                  {row.publicationExcerpt} · {dateFormatter.format(new Date(row.createdAt))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
