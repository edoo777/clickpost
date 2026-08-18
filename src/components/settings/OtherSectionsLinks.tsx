"use client";

import Link from "next/link";
import { IconAlertTriangle, IconBriefcase, IconChartBar, IconLayoutGrid, IconTag } from "@/components/icons";
import { ConflictBadge } from "@/components/conflicts/ConflictBadge";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useSyncStatus } from "@/lib/sync/use-sync-status";

export function OtherSectionsLinks() {
  const t = useTranslations();
  const conflictCount = useSyncStatus().conflictCount;

  const LINKS = [
    {
      label: t("settings.otherSections.linkBrandsLabel"),
      description: t("settings.otherSections.linkBrandsDescription"),
      href: "/marques",
      icon: IconBriefcase,
    },
    {
      label: t("settings.otherSections.linkThemesLabel"),
      description: t("settings.otherSections.linkThemesDescription"),
      href: "/thematiques",
      icon: IconTag,
    },
    {
      label: t("settings.otherSections.linkCalendarLabel"),
      description: t("settings.otherSections.linkCalendarDescription"),
      href: "/calendrier-editorial",
      icon: IconLayoutGrid,
    },
    {
      label: t("settings.otherSections.linkPerformanceLabel"),
      description: t("settings.otherSections.linkPerformanceDescription"),
      href: "/performances",
      icon: IconChartBar,
    },
    {
      label: t("settings.otherSections.linkConflictsLabel"),
      description: t("settings.otherSections.linkConflictsDescription"),
      href: "/conflits",
      icon: IconAlertTriangle,
    },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm  ">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground ">{t("settings.otherSections.title")}</h2>
        <p className="text-xs text-muted-foreground ">
          {t("settings.otherSections.description")}
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
