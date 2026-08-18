"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { STATUS_STYLE, useStatusLabel } from "@/lib/post-status";
import type { Publication } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface PublicationCardProps {
  publication: Publication;
  onClick?: () => void;
}

export function PublicationCard({ publication, onClick }: PublicationCardProps) {
  const STATUS_LABEL = useStatusLabel();
  const Icon = platformIcons[publication.platform];

  return (
    <Link
      href={`/publications/${publication.id}`}
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-zinc-400   dark:hover:border-white/[.16]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ">
            <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground ">
              {publication.brand}
            </span>
            <span className="text-xs text-muted-foreground ">
              {dateFormatter.format(new Date(publication.scheduledFor))}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[publication.status]}`}
        >
          {STATUS_LABEL[publication.status]}
        </span>
      </div>
      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {publication.excerpt || "Sans titre"}
      </p>
      <p className="truncate text-xs text-muted-foreground ">
        {publication.theme || "Sans thématique"} · {publication.owner || "Non assigné"}
      </p>
      {publication.comments.length > 0 && (
        <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ">
          {publication.comments.length} commentaire{publication.comments.length > 1 ? "s" : ""}
        </span>
      )}
    </Link>
  );
}
