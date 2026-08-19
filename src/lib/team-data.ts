import { useMemo } from "react";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import type { TeamMember, TeamRole } from "@/types/team";

export const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  manager: "Gestionnaire",
  creator: "Créateur",
  reviewer: "Réviseur",
  client_approver: "Approbateur client",
};

const ROLE_LABEL_KEY: Record<TeamRole, TranslationKey> = {
  owner: "status.role.owner",
  admin: "status.role.admin",
  manager: "status.role.manager",
  creator: "status.role.creator",
  reviewer: "status.role.reviewer",
  client_approver: "status.role.client_approver",
};

/** Version traduite de `ROLE_LABEL`, réservée aux composants React. */
export function useRoleLabel(): Record<TeamRole, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(ROLE_LABEL_KEY) as [TeamRole, TranslationKey][];
    return Object.fromEntries(entries.map(([role, key]) => [role, t(key)])) as Record<TeamRole, string>;
  }, [t]);
}

export const ROLE_STYLE: Record<TeamRole, string> = {
  owner: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  manager: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  creator: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  reviewer: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  client_approver: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

const ALL_BRANDS = ["Nova Cosmetics", "Atlas Consulting", "Le Comptoir Bio"];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Édouard Lambert",
    email: "edouard.lambert@clickpost.agency",
    role: "owner",
    status: "active",
    brands: ALL_BRANDS,
  },
  {
    id: "tm-2",
    name: "Inès Berthier",
    email: "ines.berthier@clickpost.agency",
    role: "admin",
    status: "active",
    brands: ALL_BRANDS,
  },
  {
    id: "tm-3",
    name: "Camille Dubois",
    email: "camille.dubois@clickpost.agency",
    role: "manager",
    status: "active",
    brands: ["Nova Cosmetics"],
  },
  {
    id: "tm-4",
    name: "Sami Nasri",
    email: "sami.nasri@clickpost.agency",
    role: "manager",
    status: "active",
    brands: ["Atlas Consulting"],
  },
  {
    id: "tm-5",
    name: "Léa Fontaine",
    email: "lea.fontaine@clickpost.agency",
    role: "manager",
    status: "active",
    brands: ["Le Comptoir Bio"],
  },
  {
    id: "tm-6",
    name: "Yanis Belkacem",
    email: "yanis.belkacem@clickpost.agency",
    role: "creator",
    status: "active",
    brands: ["Nova Cosmetics", "Le Comptoir Bio"],
  },
  {
    id: "tm-7",
    name: "Julien Marchand",
    email: "julien.marchand@clickpost.agency",
    role: "reviewer",
    status: "active",
    brands: ["Nova Cosmetics", "Le Comptoir Bio"],
  },
  {
    id: "tm-8",
    name: "Nadia Kader",
    email: "nadia.kader@clientmail.com",
    role: "client_approver",
    status: "active",
    brands: ["Atlas Consulting"],
  },
  {
    id: "tm-9",
    name: "Théo Rambert",
    email: "theo.rambert@clickpost.agency",
    role: "creator",
    status: "inactive",
    brands: ["Nova Cosmetics"],
  },
];

export const DEFAULT_CURRENT_USER_ID = "tm-3";
