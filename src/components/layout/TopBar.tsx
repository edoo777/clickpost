"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ManagementMenu } from "@/components/layout/ManagementMenu";
import { useBrandsSession } from "@/lib/brands-store";
import { MANAGEMENT_NAV_ITEMS, getPageTitle, isNavItemActive } from "@/lib/navigation";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

/**
 * Barre supérieure desktop/tablette (masquée sous lg — la barre mobile compacte de Sidebar.tsx
 * prend le relais). Élément de flux normal (pas de `position: fixed`) : comme le contenu
 * principal défile dans son propre conteneur (`overflow-y-auto` sur `<main>`) à l'intérieur
 * d'un parent contraint à `h-dvh`, la barre reste visuellement immobile sans calcul de
 * décalage manuel ni superposition — la même leçon que la sidebar : éviter les hacks
 * `overflow`/`fixed` quand un confinement flex correct suffit.
 */
export function TopBar() {
  const pathname = usePathname();
  const { profile, workspace, email } = useWorkspaceSession();
  const { selectableBrands, activeBrand, setActiveBrandId } = useBrandsSession();

  const pageTitle = getPageTitle(pathname ?? "/");
  const displayedUserName =
    profile?.display_name || (profile ? `${profile.first_name} ${profile.last_name}`.trim() : "") || email || "Mon profil";

  return (
    <header className="hidden h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-6 transition-[margin] duration-[250ms] ease-in-out motion-reduce:transition-none lg:flex lg:ml-[var(--sidebar-w)]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate text-base font-semibold text-foreground">{pageTitle}</h1>
        {workspace?.name && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="truncate text-sm text-muted-foreground">{workspace.name}</span>
          </>
        )}
        {selectableBrands.length > 0 && (
          <select
            value={activeBrand?.id ?? ""}
            onChange={(event) => setActiveBrandId(event.target.value || null)}
            aria-label="Marque active"
            className="ml-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
          >
            {selectableBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="hidden items-center gap-1 2xl:flex">
          {MANAGEMENT_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname ?? "", item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "text-zinc-600 hover:bg-muted dark:text-zinc-400"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="2xl:hidden">
          <ManagementMenu />
        </div>

        <Link
          href="/profil"
          aria-label={`Voir le profil de ${displayedUserName}`}
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-semibold text-white"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar externe (Supabase Storage).
            <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            displayedUserName.slice(0, 1).toUpperCase()
          )}
        </Link>
      </div>
    </header>
  );
}
