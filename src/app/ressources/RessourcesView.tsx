"use client";

import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function RessourcesView() {
  const t = useTranslations();

  return (
    <MarketingShell>
      <section className="border-b border-border bg-gradient-to-b from-violet-50/60 to-transparent px-6 py-20 dark:from-violet-500/[.06] sm:py-24">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <SectionEyebrow>{t("resources.eyebrow")}</SectionEyebrow>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("resources.title")}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("resources.subtitle")}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <Link
            href="/blog"
            className="flex flex-col gap-3 rounded-2xl border border-border bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white transition-transform hover:-translate-y-1"
          >
            <span className="text-lg font-semibold">{t("resources.blogCard.title")}</span>
            <p className="text-sm text-white/85">{t("resources.blogCard.description")}</p>
            <span className="mt-auto text-sm font-semibold underline underline-offset-4">{t("resources.blogCard.cta")}</span>
          </Link>

          <div id="guides" className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-6">
            <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("marketing.common.comingSoon")}
            </span>
            <span className="text-lg font-semibold">{t("resources.guidesCard.title")}</span>
            <p className="text-sm text-muted-foreground">{t("resources.guidesCard.description")}</p>
          </div>

          <div id="centre-aide" className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-6">
            <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("marketing.common.comingSoon")}
            </span>
            <span className="text-lg font-semibold">{t("resources.helpCenterCard.title")}</span>
            <p className="text-sm text-muted-foreground">{t("resources.helpCenterCard.description")}</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
