"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBriefcase,
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconDashboard,
  IconIdBadge,
  IconLayoutGrid,
  IconLogoMark,
  IconSend,
  IconSettingsGear,
  IconSparkles,
  IconTag,
  IconUsers,
} from "@/components/icons";
import { useTeamSession } from "@/lib/team-store";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/", icon: IconDashboard },
  { label: "Calendrier", href: "/calendrier", icon: IconCalendar },
  { label: "Calendrier éditorial", href: "/calendrier-editorial", icon: IconLayoutGrid },
  { label: "Thématiques", href: "/thematiques", icon: IconTag },
  { label: "Générateur d'idées", href: "/generateur-idees", icon: IconSparkles },
  { label: "Publications", href: "/publications", icon: IconSend },
  { label: "Approbations", href: "/approbations", icon: IconClipboardCheck },
  { label: "Marques", href: "/marques", icon: IconBriefcase },
  { label: "Comptes", href: "/comptes", icon: IconUsers },
  { label: "Équipe", href: "/equipe", icon: IconIdBadge },
  { label: "Performances", href: "/performances", icon: IconChartBar },
  { label: "Paramètres", href: "/parametres", icon: IconSettingsGear },
];

export function Sidebar() {
  const pathname = usePathname();
  const { members, currentUserId, setCurrentUserId } = useTeamSession();

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
          const isActive =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
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
      <div className="flex flex-col gap-1.5 border-t border-black/[.06] px-6 py-4 dark:border-white/[.06]">
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
          Connecté en tant que
        </label>
        <select
          value={currentUserId}
          onChange={(event) => setCurrentUserId(event.target.value)}
          className="rounded-lg border border-black/[.08] bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <div className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-600">Données de démonstration</div>
    </aside>
  );
}
