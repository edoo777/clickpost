"use client";

import { AiGenerationMockup } from "@/components/marketing/AiGenerationMockup";
import { AnalyticsMockup } from "@/components/marketing/AnalyticsMockup";
import { CalendarMockup } from "@/components/marketing/CalendarMockup";
import { HumanPlaceholder } from "@/components/marketing/HumanPlaceholder";
import { IdeaBankMockup } from "@/components/marketing/IdeaBankMockup";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PublishFlowMockup } from "@/components/marketing/PublishFlowMockup";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { StepConnector } from "@/components/marketing/StepConnector";
import { IconArrowRight } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function SolutionView() {
  const t = useTranslations();

  const captureBlocks = [0, 1, 2].map((i) => ({
    title: t(`solution.mockups.capture.blockTitles.${i}` as never),
    theme: t(`solution.mockups.capture.blockThemes.${i}` as never),
    topicsLabel: t(`solution.mockups.capture.blockTopics.${i}` as never),
  }));

  const organizeBlocks = [0, 1, 2].map((i) => ({
    title: t(`solution.mockups.organize.blockTitles.${i}` as never),
    theme: t(`solution.mockups.organize.blockThemes.${i}` as never),
    topicsLabel: t(`solution.mockups.organize.blockTopics.${i}` as never),
  }));

  const generateTopics = [0, 1, 2, 3, 4].map((i) => t(`solution.mockups.generate.topics.${i}` as never));

  const measureMetrics = [0, 1, 2, 3].map((i) => ({
    label: t(`solution.mockups.measure.metricLabels.${i}` as never),
    value: t(`solution.mockups.measure.metricValues.${i}` as never),
    changeLabel: t(`solution.mockups.measure.metricChanges.${i}` as never),
  }));

  const planCalendarLabels = {
    columnTitle: t("landing.heroCalendar.columnTitle"),
    columnNetwork: t("landing.heroCalendar.columnNetwork"),
    columnDate: t("landing.heroCalendar.columnDate"),
    columnStatus: t("landing.heroCalendar.columnStatus"),
    columnBrand: t("solution.mockups.plan.columnBrand"),
    columnMedia: t("solution.mockups.plan.columnMedia"),
    status: {
      idea: t("landing.heroCalendar.statusIdea"),
      ready: t("landing.heroCalendar.statusReady"),
      scheduled: t("landing.heroCalendar.statusScheduled"),
      published: t("landing.heroCalendar.statusPublished"),
    },
    rows: [
      { title: t("landing.heroCalendar.row1"), brand: "Studio Nova", hasMedia: true, platform: "instagram" as const, date: "3 avr.", time: "09:00", status: "idea" as const },
      { title: t("landing.heroCalendar.row3"), brand: "Studio Nova", hasMedia: true, platform: "linkedin" as const, date: "5 avr.", time: "08:00", status: "ready" as const },
      { title: t("landing.heroCalendar.row4"), brand: "Atelier Camille", hasMedia: false, platform: "tiktok" as const, date: "6 avr.", time: "18:00", status: "scheduled" as const },
      { title: t("landing.heroCalendar.row2"), brand: "Studio Nova", hasMedia: true, platform: "youtube" as const, date: "7 avr.", time: "17:00", status: "scheduled" as const },
      { title: t("landing.heroCalendar.row6"), brand: "Atelier Camille", hasMedia: true, platform: "facebook" as const, date: "9 avr.", time: "12:00", status: "published" as const },
    ],
  };

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-border bg-gradient-to-b from-violet-50/60 to-transparent px-6 py-20 dark:from-violet-500/[.06] sm:py-28">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
          <SectionEyebrow>{t("solution.hero.eyebrow")}</SectionEyebrow>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("solution.hero.title")}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("solution.hero.subtitle")}</p>
          <MarketingButton href="/inscription" size="lg" icon={<IconArrowRight className="h-4 w-4" />}>
            {t("marketing.common.startFree")}
          </MarketingButton>
        </div>
      </section>

      {/* 01 — CAPTURER */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScrollReveal className="flex flex-col gap-3">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t("solution.steps.capture.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight">{t("solution.steps.capture.title")}</h2>
            <p className="max-w-md text-base text-muted-foreground">{t("solution.steps.capture.description")}</p>
          </ScrollReveal>
          <ScrollReveal delayMs={100}>
            <IdeaBankMockup blocks={captureBlocks} className="mx-auto max-w-md transition-transform duration-300 hover:-translate-y-1" />
          </ScrollReveal>
        </div>
      </section>

      <StepConnector />

      {/* 02 — GÉNÉRER */}
      <section className="border-b border-border bg-gradient-to-br from-fuchsia-50/60 via-violet-50/40 to-transparent px-6 py-20 dark:from-fuchsia-500/[.05] dark:via-violet-500/[.05]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScrollReveal delayMs={100} className="order-2 lg:order-1">
            <AiGenerationMockup
              prompt={t("solution.mockups.generate.prompt")}
              topics={generateTopics}
              className="mx-auto max-w-md transition-transform duration-300 hover:-translate-y-1 marketing-float-slow"
            />
          </ScrollReveal>
          <ScrollReveal className="order-1 flex flex-col gap-3 lg:order-2">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t("solution.steps.generate.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight">{t("solution.steps.generate.title")}</h2>
            <p className="max-w-md text-base text-muted-foreground">{t("solution.steps.generate.description")}</p>
          </ScrollReveal>
        </div>
      </section>

      <StepConnector />

      {/* 03 — CRÉER (composition superposée avec présence humaine) */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center">
          <ScrollReveal className="flex flex-col items-center gap-3">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t("solution.steps.create.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight">{t("solution.steps.create.title")}</h2>
            <p className="max-w-md text-base text-muted-foreground">{t("solution.steps.create.description")}</p>
          </ScrollReveal>

          <div className="grid w-full grid-cols-1 items-center gap-6 sm:grid-cols-[220px_1fr]">
            <ScrollReveal delayMs={100} className="transition-transform duration-300 hover:-translate-y-1">
              <HumanPlaceholder
                persona="creatorCamera"
                alt={t("solution.mockups.create.creatorCaption")}
                label={t("solution.mockups.create.creatorCaption")}
                suggestedPath="/marketing/creator-camera.webp"
                aspectClassName="aspect-[4/5]"
                className="mx-auto w-full max-w-[220px]"
              />
            </ScrollReveal>
            <ScrollReveal delayMs={180} className="transition-transform duration-300 hover:-translate-y-1 sm:translate-y-3">
              <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-left accent-halo">
                <span className="text-sm font-semibold">{t("solution.mockups.create.scriptTitle")}</span>
                <span className="text-xs text-muted-foreground">{t("solution.mockups.create.ideaLabel")}</span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {[95, 80, 88, 60].map((width, index) => (
                    <div key={index} className="h-2 rounded-full bg-muted" style={{ width: `${width}%` }} />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <StepConnector />

      {/* 04 — ORGANISER */}
      <section className="border-b border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScrollReveal className="flex flex-col gap-3">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t("solution.steps.organize.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight">{t("solution.steps.organize.title")}</h2>
            <p className="max-w-md text-base text-muted-foreground">{t("solution.steps.organize.description")}</p>
          </ScrollReveal>
          <ScrollReveal delayMs={100}>
            <IdeaBankMockup blocks={organizeBlocks} className="mx-auto max-w-md transition-transform duration-300 hover:-translate-y-1" />
          </ScrollReveal>
        </div>
      </section>

      <StepConnector />

      {/* 05 — PLANIFIER : section star, pleine largeur, sombre spectaculaire */}
      <section className="marketing-section-dark overflow-hidden px-6 py-24">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-3 text-center">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">{t("solution.steps.plan.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t("solution.steps.plan.title")}</h2>
            <p className="max-w-xl text-white/70">{t("solution.steps.plan.description")}</p>
            <p className="mt-2 bg-gradient-to-r from-fuchsia-300 to-violet-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              {t("solution.mockups.plan.message")}
            </p>
          </ScrollReveal>
          <ScrollReveal delayMs={120}>
            <CalendarMockup labels={planCalendarLabels} variant="spectacular" liveRowIndex={0} className="mx-auto max-w-5xl" />
          </ScrollReveal>
        </div>
      </section>

      <StepConnector />

      {/* 06 — PUBLIER */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
          <ScrollReveal className="flex flex-col items-center gap-3">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t("solution.steps.publish.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight">{t("solution.steps.publish.title")}</h2>
            <p className="max-w-md text-base text-muted-foreground">{t("solution.steps.publish.description")}</p>
          </ScrollReveal>
          <ScrollReveal delayMs={100} className="w-full">
            <PublishFlowMockup className="mx-auto max-w-2xl" />
          </ScrollReveal>
          <p className="max-w-xl text-xs text-muted-foreground">{t("landing.multiNetwork.disclaimer")}</p>
        </div>
      </section>

      <StepConnector />

      {/* 07 — MESURER */}
      <section className="border-b border-border bg-gradient-to-b from-violet-50/50 to-transparent px-6 py-20 dark:from-violet-500/[.06]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScrollReveal className="flex flex-col gap-3">
            <ScrollReveal variant="pop" className="w-fit">
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t("solution.steps.measure.number")}</span>
            </ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight">{t("solution.steps.measure.title")}</h2>
            <p className="max-w-md text-base text-muted-foreground">{t("solution.steps.measure.description")}</p>
          </ScrollReveal>
          <ScrollReveal delayMs={100}>
            <AnalyticsMockup
              metrics={measureMetrics}
              bestContentLabel={t("solution.mockups.measure.bestContentLabel")}
              className="mx-auto max-w-md transition-transform duration-300 hover:-translate-y-1"
            />
          </ScrollReveal>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{t("solution.cta.title")}</h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("solution.cta.subtitle")}</p>
          <MarketingButton href="/inscription" size="lg" icon={<IconArrowRight className="h-4 w-4" />}>
            {t("marketing.common.startFree")}
          </MarketingButton>
        </div>
      </section>
    </MarketingShell>
  );
}
