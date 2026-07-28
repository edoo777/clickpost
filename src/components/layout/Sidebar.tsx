"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalendar,
  IconClipboardCheck,
  IconDashboard,
  IconIdBadge,
  IconLightbulb,
  IconLogoMark,
  IconSend,
  IconSettingsGear,
  IconUsers,
  IconWand,
} from "@/components/icons";
import { useTeamSession } from "@/lib/team-store";

const PRIMARY_NAV_ITEMS = [
  { label: "Tableau de bord", href: "/", icon: IconDashboard },
  { label: "Calendrier", href: "/calendrier", icon: IconCalendar },
  { label: "Publications", href: "/publications", icon: IconSend },
  { label: "Boîte à idées", href: "/boite-idees", icon: IconLightbulb, aliases: ["/generateur-idees", "/banque-idees"] },
  { label: "Assistant IA", href: "/assistant-ia", icon: IconWand },
];

const CONFIG_NAV_ITEMS = [
  { label: "Comptes", href: "/comptes", icon: IconUsers },
  { label: "Équipe", href: "/equipe", icon: IconIdBadge },
  { label: "Approbations", href: "/approbations", icon: IconClipboardCheck },
  { label: "Paramètres", href: "/parametres", icon: IconSettingsGear },
];

function isItemActive(pathname: string, href: string, aliases?: string[]): boolean {
  const matches = (target: string) =>
    target === "/" ? pathname === "/" : pathname === target || pathname.startsWith(`${target}/`);
  return matches(href) || (aliases?.some(matches) ?? false);
}

export function Sidebar() {
  const pathname = usePathname();
  const { members, currentUserId, setCurrentUserId } = useTeamSession();
  const currentMember = members.find((member) => member.id === currentUserId);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-white/[.08] dark:bg-black">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="accent-halo flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
          <IconLogoMark className="h-5 w-5 text-white" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          ClickPost
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Principal
          </p>
          {PRIMARY_NAV_ITEMS.map(({ label, href, icon: Icon, aliases }) => {
            const isActive = isItemActive(pathname, href, aliases);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
                    : "text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Configuration &amp; gestion
          </p>
          {CONFIG_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = isItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
                    : "text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Link
        href="/profil"
        className="mx-3 flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-violet-200 hover:bg-violet-50 dark:hover:border-violet-500/20 dark:hover:bg-violet-500/10"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white">
          {(currentMember?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {currentMember?.name ?? "Mon profil"}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">Voir le profil</span>
        </span>
      </Link>

      <div className="flex flex-col gap-1.5 border-t border-zinc-100 px-6 py-4 dark:border-white/[.06]">
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
          Connecté en tant que
        </label>
        <select
          value={currentUserId}
          onChange={(event) => setCurrentUserId(event.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300"
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
