import type { ComponentType, SVGProps } from "react";
import {
  IconAlertTriangle,
  IconCalendar,
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

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  aliases?: string[];
  subItems?: { label: string; href: string }[];
}

/**
 * Source unique des éléments de navigation principale (sidebar) — évite de dupliquer les
 * routes/icônes à plusieurs endroits.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: IconDashboard },
  { label: "Calendrier", href: "/calendrier", icon: IconCalendar },
  { label: "Publications", href: "/publications", icon: IconSend },
  {
    label: "Boîte à idées",
    href: "/boite-idees",
    icon: IconLightbulb,
    aliases: ["/generateur-idees", "/banque-idees"],
    subItems: [
      { label: "Générateur de sujets", href: "/boite-idees?tab=generateur" },
      { label: "Banque d'idées", href: "/boite-idees?tab=banque" },
    ],
  },
  { label: "Assistant IA", href: "/assistant-ia", icon: IconWand },
  { label: "Tendances", href: "/tendances", icon: IconTrendingUp },
];

/**
 * Source unique des fonctions de gestion (déplacées de la sidebar vers la barre supérieure) —
 * mêmes routes et icônes qu'auparavant, seul l'emplacement dans l'interface change.
 */
export const MANAGEMENT_NAV_ITEMS: NavItem[] = [
  { label: "Comptes", href: "/comptes", icon: IconUsers },
  { label: "Équipe", href: "/equipe", icon: IconIdBadge },
  { label: "Approbations", href: "/approbations", icon: IconClipboardCheck },
  { label: "Conflits", href: "/conflits", icon: IconAlertTriangle },
  { label: "Paramètres", href: "/parametres", icon: IconSettingsGear },
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
  label: string;
}

const PAGE_TITLES: PageTitleEntry[] = [
  { href: "/", label: "Tableau de bord" },
  { href: "/calendrier-editorial", label: "Calendrier éditorial" },
  { href: "/calendrier", label: "Calendrier éditorial" },
  { href: "/publications/new", label: "Nouvelle publication" },
  { href: "/publications", label: "Publications" },
  { href: "/generateur-idees", label: "Générateur de sujets" },
  { href: "/banque-idees", label: "Banque d'idées" },
  { href: "/boite-idees", label: "Boîte à idées" },
  { href: "/assistant-ia", label: "Assistant IA" },
  { href: "/tendances", label: "Tendances" },
  { href: "/atelier", label: "Atelier" },
  { href: "/comptes", label: "Comptes" },
  { href: "/equipe", label: "Équipe" },
  { href: "/approbations", label: "Approbations" },
  { href: "/conflits", label: "Centre des conflits" },
  { href: "/parametres", label: "Paramètres" },
  { href: "/marques", label: "Marques" },
  { href: "/performances", label: "Performances" },
  { href: "/profil", label: "Profil" },
  { href: "/thematiques", label: "Thématiques" },
];

// Les entrées les plus longues (les plus spécifiques) sont testées en premier, pour qu'une
// route comme /publications/new ne soit jamais confondue avec /publications.
const SORTED_PAGE_TITLES = [...PAGE_TITLES].sort((a, b) => b.href.length - a.href.length);

/** Titre de page affiché dans la barre supérieure, dérivé du chemin courant. */
export function getPageTitle(pathname: string): string {
  const match = SORTED_PAGE_TITLES.find((entry) =>
    entry.href === "/" ? pathname === "/" : pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  );
  return match?.label ?? "ClickPost";
}
