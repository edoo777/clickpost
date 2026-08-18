"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { DEFAULT_APPROVAL_FILTERS, getApprovalQueue } from "@/lib/approval";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";

const MAX_ITEMS = 4;

interface NeedsActionWidgetProps {
  filters?: DashboardFiltersValue;
}

export function NeedsActionWidget({ filters = DEFAULT_DASHBOARD_FILTERS }: NeedsActionWidgetProps) {
  const t = useTranslations();
  const { posts } = usePostsSession();
  const { brands } = useBrandsSession();
  const brandName = filters.brandId !== "all" ? brands.find((brand) => brand.id === filters.brandId)?.name : undefined;
  const queue = getApprovalQueue(posts, DEFAULT_APPROVAL_FILTERS)
    .filter((publication) => !brandName || publication.brand === brandName)
    .filter((publication) => filters.platform === "all" || publication.platform === filters.platform)
    .filter((publication) => filters.format === "all" || publication.format === filters.format)
    .slice(0, MAX_ITEMS);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">{t("dashboard.needsActionTitle")}</h2>
        <Link href="/approbations" className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {queue.length === 0 ? (
        <p className="text-sm text-muted-foreground ">{t("dashboard.needsActionEmpty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
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
                    <span className="truncate text-sm font-medium text-foreground ">
                      {publication.excerpt || t("dashboard.untitled")}
                    </span>
                    <span className="truncate text-xs text-muted-foreground ">{publication.brand}</span>
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
