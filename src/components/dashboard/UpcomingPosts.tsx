"use client";

import { platformIcons } from "@/components/icons";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";

const MAX_UPCOMING = 5;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function UpcomingPosts() {
  const { posts } = usePostsSession();
  const now = new Date();
  const upcoming = posts
    .filter((post) => new Date(post.scheduledFor) >= now)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .slice(0, MAX_UPCOMING);

  return (
    <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Publications à venir
      </h2>
      <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.06]">
        {upcoming.map((post) => {
          const Icon = platformIcons[post.platform];
          return (
            <li key={post.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {post.excerpt}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {post.brand} · {dateFormatter.format(new Date(post.scheduledFor))}
                </span>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[post.status]}`}
              >
                {STATUS_LABEL[post.status]}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
