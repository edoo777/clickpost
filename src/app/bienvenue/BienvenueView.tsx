"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import {
  IconBriefcase,
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconLightbulb,
  IconLinkedin,
  IconLogoMark,
  IconSend,
  IconSparkles,
  IconTrendingUp,
  IconUsers,
  IconWand,
} from "@/components/icons";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";

function Icon({ as: As, className }: { as: ComponentType<SVGProps<SVGSVGElement>>; className?: string }) {
  return <As className={className} />;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
      {children}
    </span>
  );
}

const AUDIENCES: { icon: ComponentType<SVGProps<SVGSVGElement>>; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { icon: IconLightbulb, titleKey: "landing.audienceCreatorsTitle", descriptionKey: "landing.audienceCreatorsDescription" },
  { icon: IconBriefcase, titleKey: "landing.audienceAgenciesTitle", descriptionKey: "landing.audienceAgenciesDescription" },
  { icon: IconUsers, titleKey: "landing.audienceTeamsTitle", descriptionKey: "landing.audienceTeamsDescription" },
  { icon: IconClipboardCheck, titleKey: "landing.audienceApproversTitle", descriptionKey: "landing.audienceApproversDescription" },
];

const PROBLEMS: TranslationKey[] = ["landing.problem1", "landing.problem2", "landing.problem3", "landing.problem4", "landing.problem5"];

const SOLUTION_ITEMS: { icon: ComponentType<SVGProps<SVGSVGElement>>; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { icon: IconTrendingUp, titleKey: "landing.solutionStrategyTitle", descriptionKey: "landing.solutionStrategyDescription" },
  { icon: IconLightbulb, titleKey: "landing.solutionTopicsTitle", descriptionKey: "landing.solutionTopicsDescription" },
  { icon: IconWand, titleKey: "landing.solutionWorkshopTitle", descriptionKey: "landing.solutionWorkshopDescription" },
  { icon: IconCalendar, titleKey: "landing.solutionCalendarTitle", descriptionKey: "landing.solutionCalendarDescription" },
  { icon: IconSend, titleKey: "landing.solutionPublishTitle", descriptionKey: "landing.solutionPublishDescription" },
  { icon: IconChartBar, titleKey: "landing.solutionReportsTitle", descriptionKey: "landing.solutionReportsDescription" },
];

const JOURNEY: TranslationKey[] = ["landing.journeyBrand", "landing.journeyTopic", "landing.journeyContent", "landing.journeyPublication", "landing.journeyAnalysis"];

const FEATURES: { icon: ComponentType<SVGProps<SVGSVGElement>>; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { icon: IconWand, titleKey: "landing.featureCopilotTitle", descriptionKey: "landing.featureCopilotDescription" },
  { icon: IconLightbulb, titleKey: "landing.featureGeneratorTitle", descriptionKey: "landing.featureGeneratorDescription" },
  { icon: IconSparkles, titleKey: "landing.featureWorkshopTitle", descriptionKey: "landing.featureWorkshopDescription" },
  { icon: IconCalendar, titleKey: "landing.featureCalendarTitle", descriptionKey: "landing.featureCalendarDescription" },
  { icon: IconLinkedin, titleKey: "landing.featureLinkedinTitle", descriptionKey: "landing.featureLinkedinDescription" },
  { icon: IconChartBar, titleKey: "landing.featureReportsTitle", descriptionKey: "landing.featureReportsDescription" },
  { icon: IconTrendingUp, titleKey: "landing.featurePerformanceTitle", descriptionKey: "landing.featurePerformanceDescription" },
  { icon: IconUsers, titleKey: "landing.featureMultiBrandTitle", descriptionKey: "landing.featureMultiBrandDescription" },
  { icon: IconClipboardCheck, titleKey: "landing.featureApprovalTitle", descriptionKey: "landing.featureApprovalDescription" },
];

const AGENCY_CARDS: { titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { titleKey: "landing.agencyMultiBrandTitle", descriptionKey: "landing.agencyMultiBrandDescription" },
  { titleKey: "landing.agencyReportsTitle", descriptionKey: "landing.agencyReportsDescription" },
  { titleKey: "landing.agencyCentralTitle", descriptionKey: "landing.agencyCentralDescription" },
  { titleKey: "landing.agencyProductivityTitle", descriptionKey: "landing.agencyProductivityDescription" },
];

export function BienvenueView() {
  const t = useTranslations();

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <IconLogoMark className="h-5 w-5 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">ClickPost</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link href="/connexion" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t("auth.signIn")}
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              {t("landing.ctaJoinBeta")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* HERO */}
        <section className="border-b border-border bg-gradient-to-b from-violet-50/60 to-transparent px-6 py-20 dark:from-violet-500/[.06] sm:py-28">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
            <SectionEyebrow>{t("landing.heroEyebrow")}</SectionEyebrow>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {t("landing.heroTitlePrefix")}{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {t("landing.heroTitleHighlight")}
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("landing.heroSubtitle")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/inscription"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
              >
                {t("landing.ctaJoinBeta")}
              </Link>
              <Link
                href="/connexion"
                className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t("landing.ctaAlreadyAccount")}
              </Link>
            </div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>{t("landing.audienceEyebrow")}</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.audienceTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCES.map((audience) => (
                <div key={audience.titleKey} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                    <Icon as={audience.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-semibold">{t(audience.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(audience.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLÈMES */}
        <section className="border-b border-border bg-muted/40 px-6 py-16">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>{t("landing.problemEyebrow")}</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.problemTitle")}</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {PROBLEMS.map((problemKey) => (
                <li key={problemKey} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                  <span className="text-foreground">{t(problemKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>{t("landing.solutionEyebrow")}</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.solutionTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SOLUTION_ITEMS.map((item) => (
                <div key={item.titleKey} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
                    <Icon as={item.icon} className="h-4 w-4 text-white" />
                  </span>
                  <h3 className="text-sm font-semibold">{t(item.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(item.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARCOURS */}
        <section className="border-b border-border bg-muted/40 px-6 py-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>{t("landing.journeyEyebrow")}</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.journeyTitle")}</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:gap-0">
              {JOURNEY.map((stepKey, index) => (
                <div key={stepKey} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                      {t("landing.stepLabel")} {index + 1}
                    </span>
                    <span className="text-sm font-semibold">{t(stepKey)}</span>
                  </div>
                  {index < JOURNEY.length - 1 && (
                    <span aria-hidden="true" className="hidden text-lg text-muted-foreground sm:inline">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FONCTIONNALITÉS CLÉS */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>{t("landing.featuresEyebrow")}</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.featuresTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.titleKey} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5">
                  <Icon as={feature.icon} className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-semibold">{t(feature.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground">{t(feature.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENCES */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-10 text-center text-white sm:p-14">
            <SectionEyebrow>{t("landing.agenciesEyebrow")}</SectionEyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("landing.agenciesTitle")}</h2>
            <p className="max-w-2xl text-sm text-white/85 sm:text-base">{t("landing.agenciesSubtitle")}</p>
            <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
              {AGENCY_CARDS.map((card) => (
                <div key={card.titleKey} className="rounded-xl bg-white/10 p-4">
                  <span className="text-sm font-semibold">{t(card.titleKey)}</span>
                  <p className="text-xs text-white/80">{t(card.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BÊTA */}
        <section className="px-6 py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">{t("landing.finalCtaTitle")}</h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("landing.finalCtaSubtitle")}</p>
            <Link
              href="/inscription"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              {t("landing.ctaJoinBeta")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} ClickPost. {t("landing.footerRights")}
          </span>
          <div className="flex items-center gap-5">
            <Link href="/confidentialite" className="hover:text-foreground hover:underline">
              {t("landing.footerPrivacy")}
            </Link>
            <Link href="/conditions" className="hover:text-foreground hover:underline">
              {t("landing.footerTerms")}
            </Link>
            <Link href="/connexion" className="hover:text-foreground hover:underline">
              {t("auth.signIn")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
