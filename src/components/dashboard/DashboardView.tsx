"use client";

import { useState } from "react";
import { CalendarPreview } from "@/components/dashboard/CalendarPreview";
import { ConnectedAccounts } from "@/components/dashboard/ConnectedAccounts";
import {
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardFiltersValue,
} from "@/components/dashboard/DashboardFilters";
import { MyTasksWidget } from "@/components/dashboard/MyTasksWidget";
import { NeedsActionWidget } from "@/components/dashboard/NeedsActionWidget";
import { PerformanceChartCard } from "@/components/dashboard/PerformanceChartCard";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { RecentIdeasWidget } from "@/components/dashboard/RecentIdeasWidget";
import { TopPublicationsWidget } from "@/components/dashboard/TopPublicationsWidget";
import { UpcomingPosts } from "@/components/dashboard/UpcomingPosts";

export function DashboardView() {
  const [filters, setFilters] = useState<DashboardFiltersValue>(DEFAULT_DASHBOARD_FILTERS);

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Tableau de bord
        </h1>
        <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">{today}</p>
      </header>

      <DashboardFilters value={filters} onChange={setFilters} />

      <PerformanceOverview filters={filters} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceChartCard filters={filters} />
        </div>
        <TopPublicationsWidget filters={filters} />
      </div>

      <PipelineOverview filters={filters} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarPreview />
        </div>
        <ConnectedAccounts />
      </div>

      <UpcomingPosts filters={filters} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NeedsActionWidget filters={filters} />
        <RecentActivityWidget filters={filters} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentIdeasWidget filters={filters} />
        <MyTasksWidget />
      </div>
    </>
  );
}
