"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ReportActionPlanItem } from "@/types/report";

/** Plan d'action pour la prochaine période — interprétation Claude, texte éditable avant
 * enregistrement. Réutilise l'action « Ajouter à la Banque d'idées » existante lorsqu'un titre de
 * sujet concret a été suggéré. */
export function ActionPlanSection({
  items,
  editable,
  onChange,
  onAddTopic,
}: {
  items: ReportActionPlanItem[];
  editable: boolean;
  onChange: (next: ReportActionPlanItem[]) => void;
  onAddTopic: (title: string) => void;
}) {
  const t = useTranslations();
  function handleTextChange(index: number, text: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, text } : item)));
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{t("reports.actionPlan.title")}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("reports.actionPlan.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start justify-between gap-3 rounded-lg bg-muted px-3 py-2">
              {editable ? (
                <textarea
                  value={item.text}
                  onChange={(event) => handleTextChange(index, event.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-transparent bg-transparent text-sm text-foreground focus:border-violet-300 focus:outline-none"
                />
              ) : (
                <span className="text-sm text-foreground">{item.text}</span>
              )}
              {item.suggestedTopicTitle && (
                <button
                  type="button"
                  onClick={() => onAddTopic(item.suggestedTopicTitle as string)}
                  className="shrink-0 rounded-lg border border-violet-300 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-500/40 dark:text-violet-300 dark:hover:bg-violet-500/10"
                >
                  {t("reports.actionPlan.addToBank")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
