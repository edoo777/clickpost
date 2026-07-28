"use client";

import Link from "next/link";
import { useContentWorkspace } from "@/lib/content-workspace-store";

export function PipelineOverview() {
  const { ideas } = useContentWorkspace();

  if (ideas.length === 0) {
    return (
      <section
        aria-label="Aperçu du pipeline d'idées"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-black/[.12] bg-white px-4 py-8 text-center dark:border-white/[.12] dark:bg-zinc-950"
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aucune idée pour l&apos;instant. Générez des sujets ou créez une idée pour commencer.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/generateur-idees"
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Générateur de sujets
          </Link>
          <Link
            href="/banque-idees"
            className="rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
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
      className="flex flex-col gap-3 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Pipeline d&apos;idées</h2>
        <Link href="/banque-idees" className="text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400">
          Voir la banque d&apos;idées
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.key}
            href="/banque-idees"
            className="flex flex-col gap-1 rounded-lg border border-black/[.06] p-3 hover:border-black/[.16] dark:border-white/[.06] dark:hover:border-white/[.16]"
          >
            <span className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{stat.count}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
