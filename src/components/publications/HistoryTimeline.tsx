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
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Historique</h2>
      {history.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Aucune action enregistrée pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {[...history].reverse().map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-0.5 border-l-2 border-zinc-200 pl-3 dark:border-white/[.08]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{entry.action}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {dateFormatter.format(new Date(entry.createdAt))}
                </span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{entry.actorName}</span>
              {entry.note && <p className="text-xs italic text-zinc-500 dark:text-zinc-400">{entry.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
