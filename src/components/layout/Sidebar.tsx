"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalendar,
  IconChartBar,
  IconDashboard,
  IconLogoMark,
  IconSend,
  IconUsers,
} from "@/components/icons";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/", icon: IconDashboard },
  { label: "Calendrier", href: "/calendrier", icon: IconCalendar },
  { label: "Publications", href: "/publications", icon: IconSend },
  { label: "Comptes", href: "/comptes", icon: IconUsers },
  { label: "Performances", href: "/performances", icon: IconChartBar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-black/[.08] bg-white dark:border-white/[.08] dark:bg-black">
      <div className="flex items-center gap-2 px-6 py-6">
        <IconLogoMark className="h-6 w-6 text-zinc-950 dark:text-zinc-50" />
        <span className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          ClickPost
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-6 text-xs text-zinc-400 dark:text-zinc-600">
        Données de démonstration
      </div>
    </aside>
  );
}
