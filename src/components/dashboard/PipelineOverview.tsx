"use client";

import Link from "next/link";
import { DEFAULT_DASHBOARD_FILTERS, type DashboardFiltersValue } from "@/components/dashboard/DashboardFilters";
import { useContentWorkspace } from "@/lib/content-workspace-store";

interface PipelineOverviewProps {
  filters?: DashboardFiltersValue;
}

export function PipelineOverview({ filters = DEFAULT_DASHBOARD_FILTERS }: PipelineOverviewProps) {
  const { ideas: allIdeas } = useContentWorkspace();

  const ideas = allIdeas.filter((idea) => {
    if (filters.brandId !== "all" && idea.brandId !== filters.brandId) return false;
    if (filters.platform !== "all" && idea.platform !== filters.platform) return false;
    return true;
  });

  if (ideas.length === 0) {
    return (
      <section
        aria-label="Aperçu du pipeline d'idées"
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center dark:border-white/[.15] dark:bg-zinc-950"
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aucune idée {filters.brandId !== "all" || filters.platform !== "all" ? "pour ces filtres" : "pour l'instant"}
          . Générez des sujets ou créez une idée pour commencer.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/boite-idees"
            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Générateur de sujets
          </Link>
          <Link
            href="/boite-idees"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            Banque d&apos;idées
          </Link>
        </div>
      </section>
    );
  }

  const active = ideas.filter((idea) => idea.status !== "archived");
  const withoutDate = active.filter((idea) => !idea.scheduledFor);
  const readyToTransform = active.filter(
    (idea) => !idea.publicationId && (idea.status === "approved" || idea.status === "ready_to_schedule")
  );
  const transformed = ideas.filter((idea) => idea.publicationId);

  const stats = [
    { key: "active", label: "Idées actives", count: active.length },
    { key: "withoutDate", label: "Sans date", count: withoutDate.length },
    { key: "ready", label: "Prêtes à transformer", count: readyToTransform.length },
    { key: "transformed", label: "Transformées en publication", count: transformed.length },
  ];

  return (
    <section
      aria-label="Aperçu du pipeline d'idées"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Pipeline d&apos;idées</h2>
        <Link href="/boite-idees" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
          Voir la banque d&apos;idées
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.key}
            href="/boite-idees"
            className="flex flex-col gap-1 rounded-xl border border-zinc-100 p-3 transition-colors hover:border-violet-200 hover:bg-violet-50/60 dark:border-white/[.06] dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5"
          >
            <span className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{stat.count}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
