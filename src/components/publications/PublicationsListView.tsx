"use client";

import { useMemo, useState } from "react";
import { PublicationCard } from "@/components/publications/PublicationCard";
import {
  DEFAULT_PUBLICATIONS_FILTERS,
  PublicationsFilters,
  type PublicationsFiltersValue,
} from "@/components/publications/PublicationsFilters";
import { PublicationsTable } from "@/components/publications/PublicationsTable";
import { usePostsSession } from "@/lib/posts-store";

export function PublicationsListView() {
  const { posts } = usePostsSession();
  const [filters, setFilters] = useState<PublicationsFiltersValue>(DEFAULT_PUBLICATIONS_FILTERS);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return posts
      .filter((post) => {
        if (filters.brand !== "all" && post.brand !== filters.brand) return false;
        if (filters.platform !== "all" && post.platform !== filters.platform) return false;
        if (filters.status !== "all" && post.status !== filters.status) return false;
        if (filters.dateFrom && post.scheduledFor.slice(0, 10) < filters.dateFrom) return false;
        if (filters.dateTo && post.scheduledFor.slice(0, 10) > filters.dateTo) return false;
        if (search) {
          const haystack = `${post.excerpt} ${post.text} ${post.brand} ${post.theme}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }, [posts, filters]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Publications
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {filtered.length} publication{filtered.length > 1 ? "s" : ""} affichée
          {filtered.length > 1 ? "s" : ""}
        </p>
      </header>

      <PublicationsFilters value={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
          Aucune publication ne correspond à ces critères.
        </p>
      ) : filters.viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PublicationCard key={post.id} publication={post} />
          ))}
        </div>
      ) : (
        <PublicationsTable publications={filtered} />
      )}
    </div>
  );
}
