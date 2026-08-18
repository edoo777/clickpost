"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { getNextActor } from "@/lib/approval";
import { STATUS_STYLE, useStatusLabel } from "@/lib/post-status";
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
  const STATUS_LABEL = useStatusLabel();

  if (publications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
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
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-zinc-400   dark:hover:border-white/[.16] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ">
                  <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground ">
                    {publication.excerpt || "Sans titre"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground ">
                    {publication.brand} · {dateFormatter.format(new Date(publication.scheduledFor))}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground ">
                  Responsable :{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{publication.owner || "—"}</span>
                </span>
                <span className="text-xs text-muted-foreground ">
                  Prochain intervenant :{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{nextActor ?? "—"}</span>
                </span>
                {publication.comments.length > 0 && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ">
                    {publication.comments.length} commentaire{publication.comments.length > 1 ? "s" : ""}
                  </span>
                )}
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
