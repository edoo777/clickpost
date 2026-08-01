"use client";

import Link from "next/link";
import { IconAlertTriangle, IconBriefcase, IconChartBar, IconLayoutGrid, IconTag } from "@/components/icons";
import { ConflictBadge } from "@/components/conflicts/ConflictBadge";
import { useSyncStatus } from "@/lib/sync/use-sync-status";

const LINKS = [
  {
    label: "Marques",
    description: "Niche, positionnement, comptes affiliés et thématiques de chaque marque",
    href: "/marques",
    icon: IconBriefcase,
  },
  { label: "Thématiques", description: "Bibliothèque complète, toutes marques confondues", href: "/thematiques", icon: IconTag },
  {
    label: "Calendrier éditorial",
    description: "Plans de semaine par marque",
    href: "/calendrier-editorial",
    icon: IconLayoutGrid,
  },
  { label: "Performances", description: "Rapport d'analyse détaillé", href: "/performances", icon: IconChartBar },
  {
    label: "Centre des conflits",
    description: "Résoudre les conflits de synchronisation",
    href: "/conflits",
    icon: IconAlertTriangle,
  },
];

export function OtherSectionsLinks() {
  const conflictCount = useSyncStatus().conflictCount;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground ">Autres sections</h2>
        <p className="text-xs text-muted-foreground ">
          Regroupées ici pour garder la navigation principale légère.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LINKS.map(({ label, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/60  dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {label}
                {href === "/conflits" && <ConflictBadge count={conflictCount} />}
              </span>
              <span className="text-xs text-muted-foreground ">{description}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
