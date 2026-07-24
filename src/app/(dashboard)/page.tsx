import { CalendarPreview } from "@/components/dashboard/CalendarPreview";
import { ConnectedAccounts } from "@/components/dashboard/ConnectedAccounts";
import { MyTasksWidget } from "@/components/dashboard/MyTasksWidget";
import { NeedsActionWidget } from "@/components/dashboard/NeedsActionWidget";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { UpcomingPosts } from "@/components/dashboard/UpcomingPosts";

export default function DashboardPage() {
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

      <PerformanceOverview />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarPreview />
        </div>
        <ConnectedAccounts />
      </div>

      <UpcomingPosts />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NeedsActionWidget />
        <MyTasksWidget />
      </div>
    </>
  );
}
