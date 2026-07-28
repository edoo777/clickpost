import Link from "next/link";
import { IconBriefcase, IconChartBar, IconLayoutGrid, IconTag } from "@/components/icons";

const LINKS = [
  { label: "Marques", description: "Profils de marque et positionnement", href: "/marques", icon: IconBriefcase },
  { label: "Thématiques", description: "Bibliothèque de thématiques éditoriales", href: "/thematiques", icon: IconTag },
  {
    label: "Calendrier éditorial",
    description: "Plans de semaine par marque",
    href: "/calendrier-editorial",
    icon: IconLayoutGrid,
  },
  { label: "Performances", description: "Rapport d'analyse détaillé", href: "/performances", icon: IconChartBar },
];

export function OtherSectionsLinks() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Autres sections</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Regroupées ici pour garder la navigation principale légère.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LINKS.map(({ label, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-zinc-100 p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/60 dark:border-white/[.06] dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">{description}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
