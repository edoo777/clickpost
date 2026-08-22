"use client";

import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { IconArrowRight, IconChatBubble, IconClipboardCheck, IconLayoutDocument } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function RessourcesView() {
  const t = useTranslations();

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-border px-6 py-20 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(900px_450px_at_50%_-10%,rgba(124,58,237,0.16),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <SectionEyebrow>{t("resources.eyebrow")}</SectionEyebrow>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("resources.title")}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("resources.subtitle")}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <Link
            href="/blog"
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-violet-600 via-fuchsia-600 to-blue-600 p-6 text-white shadow-xl shadow-fuchsia-500/20 transition-transform hover:-translate-y-1"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <IconLayoutDocument className="relative h-7 w-7 text-white/85" />
            <span className="relative text-lg font-semibold">{t("resources.blogCard.title")}</span>
            <p className="relative text-sm text-white/85">{t("resources.blogCard.description")}</p>
            <span className="relative mt-auto flex items-center gap-1.5 text-sm font-semibold">
              {t("resources.blogCard.cta")}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <div id="guides" className="flex flex-col gap-3 rounded-2xl border border-dashed border-violet-300/60 bg-gradient-to-br from-violet-50/60 to-transparent p-6 dark:border-violet-500/25 dark:from-violet-500/[.05]">
            <IconClipboardCheck className="h-7 w-7 text-violet-500" />
            <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("marketing.common.comingSoon")}
            </span>
            <span className="text-lg font-semibold">{t("resources.guidesCard.title")}</span>
            <p className="text-sm text-muted-foreground">{t("resources.guidesCard.description")}</p>
          </div>

          <div id="centre-aide" className="flex flex-col gap-3 rounded-2xl border border-dashed border-violet-300/60 bg-gradient-to-br from-violet-50/60 to-transparent p-6 dark:border-violet-500/25 dark:from-violet-500/[.05]">
            <IconChatBubble className="h-7 w-7 text-violet-500" />
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
