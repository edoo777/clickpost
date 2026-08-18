"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";

export function ObjectivesSection({ goals }: { goals: string[] }) {
  const t = useTranslations();
  if (goals.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{t("reports.objectives.title")}</h2>
      <p className="text-xs text-muted-foreground">{t("reports.objectives.description")}</p>
      <ul className="flex flex-wrap gap-2">
        {goals.map((goal) => (
          <li key={goal} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {goal}
          </li>
        ))}
      </ul>
    </section>
  );
}
