import type { ReportWorkItemCounts } from "@/types/report";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  const positive = percent >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {positive ? "+" : ""}
      {percent.toFixed(0)}%
    </span>
  );
}

const ITEMS: { key: keyof ReportWorkItemCounts; label: string }[] = [
  { key: "topicsCreated", label: "Sujets créés" },
  { key: "ideasCreated", label: "Idées enregistrées" },
  { key: "contentDrafted", label: "Contenus rédigés" },
  { key: "contentScheduled", label: "Contenus programmés" },
  { key: "contentPublished", label: "Contenus publiés" },
  { key: "contentArchived", label: "Contenus archivés" },
];

/** Comptages réels du travail effectué dans ClickPost — jamais une estimation (voir
 * build-report-data.ts). */
export function WorkDoneSection({ current, previous }: { current: ReportWorkItemCounts; previous: ReportWorkItemCounts | null }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">Travail réalisé</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xl font-semibold text-foreground">{current[item.key]}</span>
            {previous && <DeltaBadge percent={percentChange(current[item.key], previous[item.key])} />}
          </div>
        ))}
      </div>
    </section>
  );
}
