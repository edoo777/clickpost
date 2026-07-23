"use client";

import { useMemo, useState } from "react";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CreatePostPanel } from "@/components/calendar/CreatePostPanel";
import { DEFAULT_CALENDAR_FILTERS, FiltersBar, type CalendarFilters } from "@/components/calendar/FiltersBar";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { PostDetailPanel } from "@/components/calendar/PostDetailPanel";
import { posts } from "@/lib/demo-data";
import type { ScheduledPost } from "@/types/dashboard";

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filters.brand !== "all" && post.brand !== filters.brand) return false;
      if (filters.accountId !== "all" && post.accountId !== filters.accountId) return false;
      if (filters.platform !== "all" && post.platform !== filters.platform) return false;
      if (filters.status !== "all" && post.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  function goToPrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  return (
    <div className="flex flex-col gap-6">
      <CalendarHeader
        monthLabel={`${MONTH_NAMES[month]} ${year}`}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
        onCreate={() => setIsCreateOpen(true)}
      />

      <FiltersBar filters={filters} onChange={setFilters} />

      <MonthGrid year={year} month={month} posts={filteredPosts} onSelectPost={setSelectedPost} />

      {selectedPost && <PostDetailPanel post={selectedPost} onClose={() => setSelectedPost(null)} />}

      {isCreateOpen && <CreatePostPanel onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
}
