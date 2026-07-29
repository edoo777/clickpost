"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  IconLogout,
  IconMenu,
  IconSend,
  IconSettingsGear,
  IconSidebarCollapse,
  IconUsers,
  IconWand,
} from "@/components/icons";
import { SaveStatusIndicator } from "@/components/layout/SaveStatusIndicator";
import { SidebarCollapsedGroup } from "@/components/layout/SidebarCollapsedGroup";
import { SidebarResizeHandle } from "@/components/layout/SidebarResizeHandle";
import { ThemeQuickToggle } from "@/components/theme/ThemeQuickToggle";
import { ThemeSelect } from "@/components/theme/ThemeSelect";
import { useSettingsSession } from "@/lib/settings-store";
import { useSidebarState } from "@/lib/sidebar-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import { useTeamSession } from "@/lib/team-store";

const PRIMARY_NAV_ITEMS = [
  { label: "Tableau de bord", href: "/", icon: IconDashboard },
  { label: "Calendrier", href: "/calendrier", icon: IconCalendar },
  { label: "Publications", href: "/publications", icon: IconSend },
  {
    label: "Boîte à idées",
    href: "/boite-idees",
    icon: IconLightbulb,
    aliases: ["/generateur-idees", "/banque-idees"],
    subItems: [
      { label: "Générateur d'idées", href: "/boite-idees?tab=generateur" },
      { label: "Banque d'idées", href: "/boite-idees?tab=banque" },
    ],
  },
  { label: "Assistant IA", href: "/assistant-ia", icon: IconWand },
];

const CONFIG_NAV_ITEMS = [
  { label: "Comptes", href: "/comptes", icon: IconUsers },
  { label: "Équipe", href: "/equipe", icon: IconIdBadge },
  { label: "Approbations", href: "/approbations", icon: IconClipboardCheck },
  { label: "Paramètres", href: "/parametres", icon: IconSettingsGear },
];

type NavItem = (typeof PRIMARY_NAV_ITEMS)[number] | (typeof CONFIG_NAV_ITEMS)[number];

const TOOLTIP_CLASS =
  "pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block";

function isItemActive(pathname: string, href: string, aliases?: string[]): boolean {
  const matches = (target: string) =>
    target === "/" ? pathname === "/" : pathname === target || pathname.startsWith(`${target}/`);
  return matches(href) || (aliases?.some(matches) ?? false);
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { members, currentUserId, setCurrentUserId } = useTeamSession();
  const { settings } = useSettingsSession();
  const { isCollapsed, toggleCollapsed, width } = useSidebarState();
  const { profile, workspace, email } = useWorkspaceSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const displayedWorkspaceName = workspace?.name ?? settings.info.name;
  const displayedUserName =
    profile?.display_name || (profile ? `${profile.first_name} ${profile.last_name}`.trim() : "") || email || "Mon profil";

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  function renderNavGroup(label: string, items: NavItem[]) {
    return (
      <div className="flex flex-col gap-0.5">
        <p
          className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 ${
            isCollapsed ? "lg:hidden" : ""
          }`}
        >
          {label}
        </p>
        {items.map((item) => {
          const isActive = isItemActive(pathname, item.href, "aliases" in item ? item.aliases : undefined);
          const subItems = "subItems" in item ? item.subItems : undefined;

          if (subItems) {
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                    isCollapsed ? "lg:hidden" : ""
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-fuchsia-900/40"
                      : "text-white/60 hover:bg-white/[.06] hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
                <div className={`hidden ${isCollapsed ? "lg:block" : ""}`}>
                  <SidebarCollapsedGroup
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    subItems={subItems}
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`group relative flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                isCollapsed ? "lg:justify-center" : ""
              } ${
                isActive
                  ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-fuchsia-900/40"
                  : "text-white/60 hover:bg-white/[.06] hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={`truncate ${isCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
              {isCollapsed && <span className={TOOLTIP_CLASS}>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden dark:bg-surface">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLogoMark className="h-4 w-4 text-white" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">ClickPost</span>
        </Link>
        <div className="flex items-center gap-1">
          <SaveStatusIndicator collapsed />
          <ThemeQuickToggle className="rounded-lg p-2 text-zinc-600 hover:bg-muted dark:text-zinc-400" />
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="rounded-lg p-2 text-zinc-600 hover:bg-muted dark:text-zinc-400"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-50 flex h-dvh w-72 shrink-0 flex-col overflow-hidden bg-brand-sidebar transition-all duration-[250ms] ease-in-out motion-reduce:transition-none lg:w-[var(--sidebar-w)] lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarResizeHandle width={width} disabled={isCollapsed} />

        {/* Zone fixe du haut : logo, réduction, action principale — ne défile jamais. */}
        <div className="shrink-0">
          <div
            className={`flex items-center gap-2.5 px-5 py-5 ${
              isCollapsed ? "lg:justify-center lg:px-3" : "justify-between"
            }`}
          >
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsMobileOpen(false)}>
              <span className="accent-halo flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                <IconLogoMark className="h-5 w-5 text-white" />
              </span>
              <span className={`text-lg font-semibold tracking-tight text-white ${isCollapsed ? "lg:hidden" : ""}`}>
                ClickPost
              </span>
            </Link>
            <div className={`flex items-center gap-1 ${isCollapsed ? "lg:hidden" : ""}`}>
              <ThemeQuickToggle className="rounded-lg p-1.5 text-white/50 hover:bg-white/[.08] hover:text-white" />
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Fermer le menu"
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/[.08] hover:text-white lg:hidden"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden px-3 pb-2 lg:block">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!isCollapsed}
              aria-controls="clickpost-sidebar-nav"
              aria-label={isCollapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}
              className={`group relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/50 transition-all hover:bg-white/[.08] hover:text-white ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <IconSidebarCollapse
                className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
              <span className={isCollapsed ? "lg:hidden" : ""}>{isCollapsed ? "Déployer" : "Réduire"}</span>
              <span className={`ml-auto text-[10px] text-white/25 ${isCollapsed ? "lg:hidden" : ""}`}>Ctrl+B</span>
              <span className={TOOLTIP_CLASS}>
                {isCollapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"} · Ctrl+B
              </span>
            </button>
          </div>

          <div className="px-3 pb-3">
            <Link
              href="/publications/new"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Créer une publication"
              className={`group relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-900/40 transition-all hover:opacity-90`}
            >
              <span className="text-base leading-none">+</span>
              <span className={isCollapsed ? "lg:hidden" : ""}>Créer une publication</span>
              {isCollapsed && <span className={TOOLTIP_CLASS}>Créer une publication</span>}
            </Link>
          </div>

          <div className={`px-4 pb-3 ${isCollapsed ? "lg:hidden" : ""}`}>
            <SaveStatusIndicator />
          </div>
          <div className={`hidden pb-2 ${isCollapsed ? "lg:block" : ""}`}>
            <SaveStatusIndicator collapsed />
          </div>
        </div>

        {/* Zone centrale : occupe tout l'espace restant, défilement natif (molette/tactile)
            si le contenu dépasse — jamais de flèches de défilement, barre discrète. */}
        <nav id="clickpost-sidebar-nav" className="sidebar-nav-scroll min-h-0 flex-1 overflow-y-auto px-3">
          <div className="flex flex-col gap-3 pb-2">
            {renderNavGroup("Principal", PRIMARY_NAV_ITEMS)}
            {renderNavGroup("Configuration & gestion", CONFIG_NAV_ITEMS)}
          </div>
        </nav>

        {/* Zone fixe du bas : profil utilisateur, toujours visible (avatar seul en mode réduit). */}
        <div className="shrink-0">
          <Link
            href="/profil"
            onClick={() => setIsMobileOpen(false)}
            aria-label={`Voir le profil de ${displayedUserName}`}
            className={`group relative mx-3 mt-2 flex items-center gap-2.5 rounded-xl border border-white/[.06] px-3 py-2.5 transition-colors hover:bg-white/[.06] ${
              isCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar externe (Supabase Storage).
              <img src={profile.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-xs font-semibold text-white">
                {displayedUserName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className={`flex min-w-0 flex-1 flex-col ${isCollapsed ? "lg:hidden" : ""}`}>
              <span className="truncate text-xs font-medium text-white">{displayedWorkspaceName}</span>
              <span className="truncate text-[11px] text-white/40">{displayedUserName}</span>
            </span>
            <IconChevronDown className={`h-3.5 w-3.5 shrink-0 text-white/40 ${isCollapsed ? "lg:hidden" : ""}`} />
            {isCollapsed && <span className={TOOLTIP_CLASS}>{displayedUserName}</span>}
          </Link>

          <div className={`flex flex-col gap-1.5 px-3 pt-3 ${isCollapsed ? "lg:hidden" : ""}`}>
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-white/30">Thème</label>
            <ThemeSelect surface="dark" />
          </div>

          <div className={`flex flex-col gap-1.5 border-t border-white/[.06] px-5 py-3 ${isCollapsed ? "lg:hidden" : ""}`}>
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

          <div className={`px-3 pb-3 ${isCollapsed ? "lg:hidden" : ""}`}>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/[.06] hover:text-white"
            >
              <IconLogout className="h-4 w-4 shrink-0" />
              Déconnexion
            </button>
          </div>

          <div className={`px-5 py-3 text-xs text-white/25 ${isCollapsed ? "lg:hidden" : ""}`}>
            Données de démonstration
          </div>
        </div>
      </aside>
    </>
  );
}
