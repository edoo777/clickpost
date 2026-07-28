"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { getNextActor } from "@/lib/approval";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import { useTeamSession } from "@/lib/team-store";

const MAX_ITEMS = 4;
const ACTIONABLE_STATUSES = new Set(["in_production", "in_review", "pending_client"]);

export function MyTasksWidget() {
  const { posts } = usePostsSession();
  const { members, currentUserId } = useTeamSession();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";

  const myTasks = posts
    .filter((post) => ACTIONABLE_STATUSES.has(post.status) && getNextActor(post) === currentUserName)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .slice(0, MAX_ITEMS);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">Mes tâches</h2>
        <span className="text-xs text-muted-foreground ">{currentUserName}</span>
      </div>
      {myTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Aucune tâche assignée pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
          {myTasks.map((publication) => {
            const Icon = platformIcons[publication.platform];
            return (
              <li key={publication.id}>
                <Link
                  href={`/publications/${publication.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                    <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground ">
                      {publication.excerpt || "Sans titre"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground ">{publication.brand}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[publication.status]}`}
                  >
                    {STATUS_LABEL[publication.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
