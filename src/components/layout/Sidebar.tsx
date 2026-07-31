"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconClose,
  IconLogoMark,
  IconLogout,
  IconMenu,
  IconSidebarCollapse,
} from "@/components/icons";
import { ManagementMenu } from "@/components/layout/ManagementMenu";
import { SaveStatusIndicator } from "@/components/layout/SaveStatusIndicator";
import { SidebarCollapsedGroup } from "@/components/layout/SidebarCollapsedGroup";
import { SidebarResizeHandle } from "@/components/layout/SidebarResizeHandle";
import { ThemeQuickToggle } from "@/components/theme/ThemeQuickToggle";
import { ThemeSelect } from "@/components/theme/ThemeSelect";
import { PRIMARY_NAV_ITEMS, isNavItemActive, type NavItem } from "@/lib/navigation";
import { useSidebarState } from "@/lib/sidebar-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTeamSession } from "@/lib/team-store";

const TOOLTIP_CLASS =
  "pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { members, currentUserId, setCurrentUserId } = useTeamSession();
  const { isCollapsed, toggleCollapsed, width } = useSidebarState();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  function renderNavGroup(items: NavItem[]) {
    return (
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href, "aliases" in item ? item.aliases : undefined);
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
          <ManagementMenu
            iconOnly
            triggerClassName="flex items-center rounded-lg p-2 text-zinc-600 hover:bg-muted dark:text-zinc-400"
          />
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
        <div className="sidebar-top-zone shrink-0">
          <div
            className={`flex items-center gap-2.5 px-5 py-4 ${
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

          <div className="px-3 pb-2">
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

          {/* Aucune ligne permanente : n'affiche quelque chose que lorsqu'une notification
              temporaire est réellement nécessaire (enregistrement bref, erreur, conflit). */}
          <div className={isCollapsed ? "lg:hidden" : ""}>
            <SaveStatusIndicator />
          </div>
          <div className={`hidden ${isCollapsed ? "lg:block" : ""}`}>
            <SaveStatusIndicator collapsed />
          </div>
        </div>

        {/* Zone centrale : jamais de défilement — la hauteur nécessaire est réduite au minimum
            (voir zones haut/bas) pour que tous les boutons tiennent sans scroll ni flèches. */}
        <nav id="clickpost-sidebar-nav" className="flex-1 px-3">
          <div className="flex flex-col gap-1 pb-2">{renderNavGroup(PRIMARY_NAV_ITEMS)}</div>
        </nav>

        {/* Zone fixe du bas : préférences et session — jamais de carte marque/workspace
            (déjà accessible via la barre supérieure et l'avatar de profil). */}
        <div className={`sidebar-bottom-zone shrink-0 border-t border-white/[.06] ${isCollapsed ? "lg:border-t-0" : ""}`}>
          <div className={`flex flex-col gap-1.5 px-3 pt-2 ${isCollapsed ? "lg:hidden" : ""}`}>
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-white/30">Thème</label>
            <ThemeSelect surface="dark" />
          </div>

          <div className={`flex flex-col gap-1.5 px-3 pt-2 ${isCollapsed ? "lg:hidden" : ""}`}>
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-white/30">
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

          <div className={`px-3 py-2 ${isCollapsed ? "lg:hidden" : ""}`}>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/[.06] hover:text-white"
            >
              <IconLogout className="h-4 w-4 shrink-0" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
