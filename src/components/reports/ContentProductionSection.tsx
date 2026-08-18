"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import type { RankedCount, ReportContentBreakdown } from "@/types/report";

function BreakdownList({ title, items }: { title: string; items: RankedCount[] }) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("reports.contentProduction.noData")}</p>
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
  const t = useTranslations();
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.contentProduction.title")}</h2>
        <span className="text-sm font-semibold text-foreground">
          {t("reports.contentProduction.contentCount", { count: breakdown.total, plural: breakdown.total > 1 ? "s" : "" })}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BreakdownList title={t("reports.contentProduction.byPlatform")} items={breakdown.byPlatform} />
        <BreakdownList title={t("reports.contentProduction.byFormat")} items={breakdown.byFormat} />
        <BreakdownList title={t("reports.contentProduction.byTheme")} items={breakdown.byTheme} />
        <BreakdownList title={t("reports.contentProduction.byStatus")} items={breakdown.byStatus} />
      </div>
    </section>
  );
}
