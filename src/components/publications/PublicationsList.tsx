"use client";

import { platformIcons } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { STATUS_STYLE, useStatusLabel } from "@/lib/post-status";
import type { Publication } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface PublicationsListProps {
  publications: Publication[];
  onOpen: (id: string) => void;
}

export function PublicationsList({ publications, onOpen }: PublicationsListProps) {
  const t = useTranslations();
  const STATUS_LABEL = useStatusLabel();
  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface  ">
      {publications.map((post) => {
        const Icon = platformIcons[post.platform];
        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onOpen(post.id)}
            className="flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ">
              <Icon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </span>
            <span className="w-28 shrink-0 text-xs text-muted-foreground ">
              {dateFormatter.format(new Date(post.scheduledFor))}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {post.excerpt || t("publications.card.untitled")}
            </span>
            <span className="w-32 shrink-0 truncate text-xs text-muted-foreground ">{post.brand}</span>
            <span className="w-32 shrink-0 truncate text-xs text-muted-foreground ">{post.owner || "—"}</span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[post.status]}`}>
              {STATUS_LABEL[post.status]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
