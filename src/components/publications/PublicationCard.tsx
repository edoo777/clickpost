import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import type { Publication } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface PublicationCardProps {
  publication: Publication;
}

export function PublicationCard({ publication }: PublicationCardProps) {
  const Icon = platformIcons[publication.platform];

  return (
    <Link
      href={`/publications/${publication.id}`}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-white/[.08] dark:bg-zinc-950 dark:hover:border-white/[.16]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {publication.brand}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
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
      <p className="truncate text-xs text-zinc-400 dark:text-zinc-600">
        {publication.theme || "Sans thématique"} · {publication.owner || "Non assigné"}
      </p>
    </Link>
  );
}
