"use client";

import { useState } from "react";
import { ApprovalFilters } from "@/components/approvals/ApprovalFilters";
import { ApprovalQueueList } from "@/components/approvals/ApprovalQueueList";
import {
  DEFAULT_APPROVAL_FILTERS,
  getApprovalQueue,
  type ApprovalFilters as ApprovalFiltersState,
} from "@/lib/approval";
import { usePostsSession } from "@/lib/posts-store";
import { useTeamSession } from "@/lib/team-store";

export function ApprovalQueueView() {
  const { posts } = usePostsSession();
  const { members } = useTeamSession();
  const [filters, setFilters] = useState<ApprovalFiltersState>(DEFAULT_APPROVAL_FILTERS);

  const queue = getApprovalQueue(posts, filters);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          File d&apos;approbation
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {`${queue.length} publication${queue.length > 1 ? "s" : ""} en attente d'action`}
        </p>
      </header>

      <ApprovalFilters value={filters} members={members} onChange={setFilters} />

      <ApprovalQueueList publications={queue} />
    </div>
  );
}
