"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconCalendar,
  IconChevronDown,
  IconClipboardCheck,
  IconClose,
  IconDashboard,
  IconIdBadge,
  IconLightbulb,
  IconLogoMark,
  IconMenu,
  IconSend,
  IconSettingsGear,
  IconUsers,
  IconWand,
} from "@/components/icons";
import { useSettingsSession } from "@/lib/settings-store";
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
  const { settings } = useSettingsSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentMember = members.find((member) => member.id === currentUserId);

  function renderNavGroup(label: string, items: typeof PRIMARY_NAV_ITEMS) {
    return (
      <div className="flex flex-col gap-0.5">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
        {items.map(({ label: itemLabel, href, icon: Icon, aliases }) => {
          const isActive = isItemActive(pathname, href, aliases);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/40"
                  : "text-white/60 hover:bg-white/[.06] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{itemLabel}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden dark:border-white/[.08] dark:bg-black">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLogoMark className="h-4 w-4 text-white" />
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">ClickPost</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <IconMenu className="h-5 w-5" />
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 shrink-0 flex-col overflow-hidden bg-[#0e0a1a] transition-transform duration-200 ease-out lg:w-64 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Zone fixe du haut : logo + action principale, ne défile jamais. */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2.5 px-5 py-6">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsMobileOpen(false)}>
              <span className="accent-halo flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                <IconLogoMark className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">ClickPost</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Fermer le menu"
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/[.08] hover:text-white lg:hidden"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 pb-4">
            <Link
              href="/publications/new"
              onClick={() => setIsMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-900/40 transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              <span className="text-base leading-none">+</span> Créer une publication
            </Link>
          </div>
        </div>

        {/* Zone centrale : seule la navigation défile si elle dépasse la hauteur disponible. */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3">
          <div className="flex flex-col gap-4 pb-2">
            {renderNavGroup("Principal", PRIMARY_NAV_ITEMS)}
            {renderNavGroup("Configuration & gestion", CONFIG_NAV_ITEMS)}
          </div>
        </nav>

        {/* Zone fixe du bas : profil utilisateur, toujours visible. */}
        <div className="shrink-0">
          <Link
            href="/profil"
            onClick={() => setIsMobileOpen(false)}
            className="mx-3 mt-2 flex items-center gap-2.5 rounded-xl border border-white/[.06] px-3 py-2.5 transition-colors hover:bg-white/[.06]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white">
              {(currentMember?.name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-white">{settings.info.name}</span>
              <span className="truncate text-[11px] text-white/40">{currentMember?.name ?? "Mon profil"}</span>
            </span>
            <IconChevronDown className="h-3.5 w-3.5 shrink-0 text-white/40" />
          </Link>

          <div className="flex flex-col gap-1.5 border-t border-white/[.06] px-5 py-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-white/30">
              Connecté en tant que
            </label>
            <select
              value={currentUserId}
              onChange={(event) => setCurrentUserId(event.target.value)}
              className="rounded-lg border border-white/[.1] bg-white/[.04] px-2 py-1.5 text-xs text-white/80"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id} className="text-black">
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="px-5 py-4 text-xs text-white/25">Données de démonstration</div>
        </div>
      </aside>
    </>
  );
}
