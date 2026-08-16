import type { RankedCount, ReportContentBreakdown } from "@/types/report";

function BreakdownList({ title, items }: { title: string; items: RankedCount[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune donnée.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-foreground">{item.label}</span>
              <span className="shrink-0 font-medium text-muted-foreground">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ContentProductionSection({ breakdown }: { breakdown: ReportContentBreakdown }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Production de contenu</h2>
        <span className="text-sm font-semibold text-foreground">
          {breakdown.total} contenu{breakdown.total > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BreakdownList title="Par plateforme" items={breakdown.byPlatform} />
        <BreakdownList title="Par format" items={breakdown.byFormat} />
        <BreakdownList title="Par thématique" items={breakdown.byTheme} />
        <BreakdownList title="Par statut" items={breakdown.byStatus} />
      </div>
    </section>
  );
}
