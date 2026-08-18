"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import type { PublicationHistoryEntry } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface HistoryTimelineProps {
  history: PublicationHistoryEntry[];
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  const t = useTranslations();
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{t("publications.history.title")}</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground ">{t("publications.history.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {[...history].reverse().map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-0.5 border-l-2 border-border pl-3 "
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{entry.action}</span>
                <span className="text-xs text-muted-foreground ">
                  {dateFormatter.format(new Date(entry.createdAt))}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ">{entry.actorName}</span>
              {entry.note && <p className="text-xs italic text-muted-foreground ">{entry.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
