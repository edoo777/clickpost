import type { ComponentType, SVGProps } from "react";
import {
  IconAlertTriangle,
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconDashboard,
  IconIdBadge,
  IconLightbulb,
  IconSend,
  IconSettingsGear,
  IconTrendingUp,
  IconUsers,
  IconWand,
} from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n/locale-provider";

export interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  aliases?: string[];
  subItems?: { labelKey: TranslationKey; href: string }[];
}

/**
 * Source unique des éléments de navigation principale (sidebar) — évite de dupliquer les
 * routes/icônes à plusieurs endroits. `labelKey` pointe vers le dictionnaire i18n (voir
 * src/lib/i18n/) : les composants qui consomment ces éléments doivent appeler `t(item.labelKey)`,
 * jamais afficher `labelKey` directement.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/", icon: IconDashboard },
  { labelKey: "nav.calendar", href: "/calendrier", icon: IconCalendar },
  { labelKey: "nav.publications", href: "/publications", icon: IconSend },
  {
    labelKey: "nav.ideasBank",
    href: "/boite-idees",
    icon: IconLightbulb,
    aliases: ["/generateur-idees", "/banque-idees"],
    subItems: [
      { labelKey: "nav.ideasGenerator", href: "/boite-idees?tab=generateur" },
      { labelKey: "nav.ideasBankTab", href: "/boite-idees?tab=banque" },
    ],
  },
  { labelKey: "nav.assistant", href: "/assistant-ia", icon: IconWand },
  { labelKey: "nav.trends", href: "/tendances", icon: IconTrendingUp },
  { labelKey: "nav.reports", href: "/rapports", icon: IconChartBar },
];

/**
 * Source unique des fonctions de gestion (déplacées de la sidebar vers la barre supérieure) —
 * mêmes routes et icônes qu'auparavant, seul l'emplacement dans l'interface change.
 */
export const MANAGEMENT_NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.accounts", href: "/comptes", icon: IconUsers },
  { labelKey: "nav.team", href: "/equipe", icon: IconIdBadge },
  { labelKey: "nav.approvals", href: "/approbations", icon: IconClipboardCheck },
  { labelKey: "nav.conflicts", href: "/conflits", icon: IconAlertTriangle },
  { labelKey: "nav.settings", href: "/parametres", icon: IconSettingsGear },
];

/** Route affichant un badge de compte (conflits en attente) dans la navigation — F1.7. */
export const CONFLICTS_NAV_HREF = "/conflits";

export function isNavItemActive(pathname: string, href: string, aliases?: string[]): boolean {
  const matches = (target: string) =>
    target === "/" ? pathname === "/" : pathname === target || pathname.startsWith(`${target}/`);
  return matches(href) || (aliases?.some(matches) ?? false);
}

interface PageTitleEntry {
  href: string;
  labelKey: TranslationKey;
}

const PAGE_TITLES: PageTitleEntry[] = [
  { href: "/", labelKey: "pageTitle.dashboard" },
  { href: "/calendrier-editorial", labelKey: "pageTitle.editorialCalendar" },
  { href: "/calendrier", labelKey: "pageTitle.editorialCalendar" },
  { href: "/publications/new", labelKey: "pageTitle.newPublication" },
  { href: "/publications", labelKey: "pageTitle.publications" },
  { href: "/generateur-idees", labelKey: "pageTitle.topicGenerator" },
  { href: "/banque-idees", labelKey: "pageTitle.ideasBankPage" },
  { href: "/boite-idees", labelKey: "pageTitle.ideasBank" },
  { href: "/assistant-ia", labelKey: "pageTitle.assistant" },
  { href: "/tendances", labelKey: "pageTitle.trends" },
  { href: "/rapports", labelKey: "pageTitle.reports" },
  { href: "/atelier", labelKey: "pageTitle.workshop" },
  { href: "/comptes", labelKey: "pageTitle.accounts" },
  { href: "/equipe", labelKey: "pageTitle.team" },
  { href: "/approbations", labelKey: "pageTitle.approvals" },
  { href: "/conflits", labelKey: "pageTitle.conflictCenter" },
  { href: "/parametres", labelKey: "pageTitle.settings" },
  { href: "/marques", labelKey: "pageTitle.brands" },
  { href: "/performances", labelKey: "pageTitle.performance" },
  { href: "/profil", labelKey: "pageTitle.profile" },
  { href: "/thematiques", labelKey: "pageTitle.themes" },
];

// Les entrées les plus longues (les plus spécifiques) sont testées en premier, pour qu'une
// route comme /publications/new ne soit jamais confondue avec /publications.
const SORTED_PAGE_TITLES = [...PAGE_TITLES].sort((a, b) => b.href.length - a.href.length);

/** Clé i18n du titre de page dérivé du chemin courant — à résoudre avec `t()`, jamais affichée
 * telle quelle (voir TopBar.tsx). */
export function getPageTitleKey(pathname: string): TranslationKey | null {
  const match = SORTED_PAGE_TITLES.find((entry) =>
    entry.href === "/" ? pathname === "/" : pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  );
  return match?.labelKey ?? null;
}
