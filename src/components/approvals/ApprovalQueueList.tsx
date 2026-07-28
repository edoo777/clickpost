import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { getNextActor } from "@/lib/approval";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import type { Publication } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface ApprovalQueueListProps {
  publications: Publication[];
}

export function ApprovalQueueList({ publications }: ApprovalQueueListProps) {
  if (publications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
        Aucune publication en attente d&apos;approbation.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {publications.map((publication) => {
        const Icon = platformIcons[publication.platform];
        const nextActor = getNextActor(publication);
        return (
          <li key={publication.id}>
            <Link
              href={`/publications/${publication.id}`}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-white/[.08] dark:bg-zinc-950 dark:hover:border-white/[.16] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {publication.excerpt || "Sans titre"}
                  </span>
                  <span className="truncate text-xs text-zinc-400 dark:text-zinc-600">
                    {publication.brand} · {dateFormatter.format(new Date(publication.scheduledFor))}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Responsable :{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{publication.owner || "—"}</span>
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Prochain intervenant :{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{nextActor ?? "—"}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[publication.status]}`}
                >
                  {STATUS_LABEL[publication.status]}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
