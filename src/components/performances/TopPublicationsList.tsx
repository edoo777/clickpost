"use client";

import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";
import { platformColors } from "@/lib/platform-colors";
import type { PublicationPerformance } from "@/types/analytics";
import type { Publication } from "@/types/publication";

interface TopPublicationsListProps {
  publications: Array<Publication & { performance: PublicationPerformance; engagementRate: number }>;
  title?: string;
}

export function TopPublicationsList({ publications, title }: TopPublicationsListProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const localeCode = locale === "fr" ? "fr-FR" : "en-US";
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{title ?? t("performances.topPublications.defaultTitle")}</h2>
      {publications.length === 0 ? (
        <p className="text-sm text-muted-foreground ">{t("performances.notEnoughData")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
          {publications.map((publication) => {
            const Icon = platformIcons[publication.platform];
            const color = platformColors[publication.platform];
            return (
              <li key={publication.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color.bg}`}>
                  <Icon className={`h-4 w-4 ${color.text}`} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/publications/${publication.id}`}
                    className="truncate text-sm font-medium text-foreground hover:underline "
                  >
                    {publication.excerpt || t("dashboard.untitled")}
                  </Link>
                  <span className="truncate text-xs text-muted-foreground ">
                    {publication.brand} · {publication.performance.impressions.toLocaleString(localeCode)}{" "}
                    {t("performances.topPublications.impressionsSuffix")}
                    {publication.performance.source === "demo" ? ` · ${t("performances.topPublications.demoSuffix")}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {publication.engagementRate.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
