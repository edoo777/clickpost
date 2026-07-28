"use client";

import Link from "next/link";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { IDEA_STATUS_LABEL, IDEA_STATUS_STYLE } from "@/lib/idea-status";

const MAX_ITEMS = 5;
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

interface RecentIdeasWidgetProps {
  filters?: DashboardFiltersValue;
}

export function RecentIdeasWidget({ filters = DEFAULT_DASHBOARD_FILTERS }: RecentIdeasWidgetProps) {
  const { ideas } = useContentWorkspace();

  const recent = ideas
    .filter((idea) => idea.status !== "archived")
    .filter((idea) => filters.brandId === "all" || idea.brandId === filters.brandId)
    .filter((idea) => filters.platform === "all" || idea.platform === filters.platform)
    .filter((idea) => filters.format === "all" || idea.format === filters.format)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_ITEMS);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">Idées récentes</h2>
        <Link href="/boite-idees" className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
          Voir tout
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Aucune idée pour ces filtres.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
          {recent.map((idea) => (
            <li key={idea.id}>
              <Link href={`/atelier/${idea.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground ">
                    {idea.title || "Sans titre"}
                  </span>
                  <span className="text-xs text-muted-foreground ">
                    {dateFormatter.format(new Date(idea.updatedAt))}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}
                >
                  {IDEA_STATUS_LABEL[idea.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
