"use client";

import type { ComponentType, SVGProps } from "react";
import { CalendarMockup } from "@/components/marketing/CalendarMockup";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MockupPlaceholder } from "@/components/marketing/MockupPlaceholder";
import { PlatformBadgeRow } from "@/components/marketing/PlatformBadgeRow";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { VideoPlayer } from "@/components/marketing/VideoPlayer";
import {
  IconArrowRight,
  IconBriefcase,
  IconCheck,
  IconLightbulb,
  IconSparkles,
  IconUsers,
  IconWand,
} from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

function Icon({ as: As, className }: { as: ComponentType<SVGProps<SVGSVGElement>>; className?: string }) {
  return <As className={className} />;
}

const FOR_WHO_CARDS: { key: "creators" | "entrepreneurs" | "consultants" | "agencies" | "marketingTeams"; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "creators", icon: IconLightbulb },
  { key: "entrepreneurs", icon: IconWand },
  { key: "consultants", icon: IconSparkles },
  { key: "agencies", icon: IconBriefcase },
  { key: "marketingTeams", icon: IconUsers },
];

/**
 * Page d'accueil du site public — réécrite intégralement autour du positionnement "calendrier de
 * publication intelligent" (voir le mandat). Aucune donnée fabriquée : la vidéo produit et les
 * captures d'écran restent des emplacements prêts (MockupPlaceholder/VideoPlayer) tant qu'aucun
 * asset réel n'existe sous /public/marketing ou /public/videos.
 */
export function BienvenueView() {
  const t = useTranslations();

  const heroRows = [
    { title: t("landing.heroCalendar.row1"), platform: "instagram" as const, date: "12 mars", time: "09:00", status: "published" as const },
    { title: t("landing.heroCalendar.row2"), platform: "youtube" as const, date: "14 mars", time: "17:30", status: "scheduled" as const },
    { title: t("landing.heroCalendar.row3"), platform: "linkedin" as const, date: "16 mars", time: "08:00", status: "scheduled" as const },
    { title: t("landing.heroCalendar.row4"), platform: "tiktok" as const, date: "18 mars", time: "12:00", status: "ready" as const },
    { title: t("landing.heroCalendar.row5"), platform: "x" as const, date: "19 mars", time: "10:00", status: "idea" as const },
    { title: t("landing.heroCalendar.row6"), platform: "facebook" as const, date: "21 mars", time: "15:00", status: "idea" as const },
  ];

  const calendarLabels = {
    columnTitle: t("landing.heroCalendar.columnTitle"),
    columnNetwork: t("landing.heroCalendar.columnNetwork"),
    columnDate: t("landing.heroCalendar.columnDate"),
    columnStatus: t("landing.heroCalendar.columnStatus"),
    status: {
      idea: t("landing.heroCalendar.statusIdea"),
      ready: t("landing.heroCalendar.statusReady"),
      scheduled: t("landing.heroCalendar.statusScheduled"),
      published: t("landing.heroCalendar.statusPublished"),
    },
    floatingIdea: t("landing.heroCalendar.floatingIdea"),
    floatingScript: t("landing.heroCalendar.floatingScript"),
    floatingScheduled: t("landing.heroCalendar.floatingScheduled"),
    floatingPublished: t("landing.heroCalendar.floatingPublished"),
    floatingEngagement: t("landing.heroCalendar.floatingEngagement"),
    rows: heroRows,
  };

  const beforeItems = [0, 1, 2, 3, 4].map((i) => t(`landing.excel.beforeItems.${i}` as never));
  const afterSteps = [0, 1, 2, 3, 4].map((i) => t(`landing.excel.afterSteps.${i}` as never));
  const calendarBullets = Array.from({ length: 12 }, (_, i) => t(`landing.calendarSection.bullets.${i}` as never));
  const aiCapabilities = Array.from({ length: 9 }, (_, i) => t(`landing.ai.capabilities.${i}` as never));
  const workflowSteps = Array.from({ length: 6 }, (_, i) => t(`landing.workflow.steps.${i}` as never));
  const ideaBankTopics = Array.from({ length: 5 }, (_, i) => t(`landing.ideaBank.exampleTopics.${i}` as never));

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-violet-50/60 to-transparent px-6 pb-24 pt-16 dark:from-violet-500/[.06] sm:pt-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14">
          <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
            <SectionEyebrow>{t("landing.hero.eyebrow")}</SectionEyebrow>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing.hero.titleLine")}{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {t("landing.hero.titleHighlight")}
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("landing.hero.subtitle")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <MarketingButton href="/inscription" size="lg" icon={<IconArrowRight className="h-4 w-4" />}>
                {t("landing.hero.ctaPrimary")}
              </MarketingButton>
              <MarketingButton href="#demo" variant="secondary" size="lg">
                {t("landing.hero.ctaSecondary")}
              </MarketingButton>
            </div>
            <p className="text-xs text-muted-foreground">{t("landing.hero.note")}</p>
          </div>

          <div className="w-full max-w-3xl px-4 lg:px-16">
            <CalendarMockup labels={calendarLabels} />
          </div>
        </div>
      </section>

      {/* FINI EXCEL */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.excel.eyebrow")}</SectionEyebrow>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.excel.title")}</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <ScrollReveal className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("landing.excel.beforeLabel")}</span>
              <ul className="flex flex-col gap-2.5">
                {beforeItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <div className="hidden justify-center lg:flex">
              <IconArrowRight className="h-8 w-8 text-violet-500" />
            </div>

            <ScrollReveal delayMs={120} className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/80">{t("landing.excel.afterLabel")}</span>
              <div className="flex flex-col gap-2">
                {afterSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">{index + 1}</span>
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal className="text-center text-lg font-semibold tracking-tight sm:text-xl">{t("landing.excel.message")}</ScrollReveal>
        </div>
      </section>

      {/* CALENDRIER INTELLIGENT */}
      <section id="fonctionnalites" className="border-b border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScrollReveal className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <SectionEyebrow>{t("landing.calendarSection.eyebrow")}</SectionEyebrow>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.calendarSection.title")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {calendarBullets.map((bullet) => (
                <div key={bullet} className="flex items-center gap-2 text-sm text-foreground/90">
                  <IconCheck className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                  {bullet}
                </div>
              ))}
            </div>
            <p className="text-base font-semibold">{t("landing.calendarSection.message1")}</p>
            <p className="text-sm text-muted-foreground">{t("landing.calendarSection.message2")}</p>
          </ScrollReveal>

          <ScrollReveal delayMs={150}>
            <CalendarMockup labels={calendarLabels} className="mx-auto max-w-xl" />
          </ScrollReveal>
        </div>
      </section>

      {/* VIDÉO PRODUIT */}
      <section id="demo" className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.video.eyebrow")}</SectionEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.video.title")}</h2>
          </ScrollReveal>
          <ScrollReveal delayMs={100}>
            <VideoPlayer
              posterLabel={t("landing.video.posterLabel")}
              playLabel={t("landing.video.playLabel")}
              comingSoonLabel={t("landing.video.comingSoon")}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* BANQUE D'IDÉES */}
      <section className="border-b border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ScrollReveal className="flex flex-col gap-4">
            <SectionEyebrow>{t("landing.ideaBank.eyebrow")}</SectionEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.ideaBank.title")}</h2>
            <p className="text-sm text-muted-foreground sm:text-base">{t("landing.ideaBank.description")}</p>
          </ScrollReveal>

          <ScrollReveal delayMs={120} className="rounded-2xl border border-border bg-surface p-6 accent-halo">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("landing.ideaBank.exampleTitleLabel")}</span>
              <span className="text-lg font-semibold">{t("landing.ideaBank.exampleTitleValue")}</span>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("landing.ideaBank.exampleThemeLabel")}</span>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 w-fit">
                {t("landing.ideaBank.exampleThemeValue")}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("landing.ideaBank.exampleTopicsLabel")}</span>
              <ol className="mt-1 flex flex-col gap-1.5">
                {ideaBankTopics.map((topic, index) => (
                  <li key={topic} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {topic}
                  </li>
                ))}
              </ol>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* IA COPILOTE */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.ai.eyebrow")}</SectionEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.ai.title")}</h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("landing.ai.subtitle")}</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {aiCapabilities.map((capability, index) => (
              <ScrollReveal key={capability} delayMs={index * 40} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium">
                <IconSparkles className="h-4 w-4 shrink-0 text-fuchsia-600 dark:text-fuchsia-400" />
                {capability}
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW / SYSTÈME */}
      <section className="border-b border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.workflow.eyebrow")}</SectionEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.workflow.title")}</h2>
          </ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-violet-200 bg-surface px-4 py-2 text-sm font-semibold dark:border-violet-500/30">{step}</span>
                {index < workflowSteps.length - 1 && (
                  <IconArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MULTI-RÉSEAUX */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <SectionEyebrow>{t("landing.multiNetwork.eyebrow")}</SectionEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.multiNetwork.title")}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{t("landing.multiNetwork.description")}</p>
          <PlatformBadgeRow className="mt-2" />
          <p className="max-w-xl text-xs text-muted-foreground">{t("landing.multiNetwork.disclaimer")}</p>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="border-b border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.forWho.eyebrow")}</SectionEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.forWho.title")}</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {FOR_WHO_CARDS.map((card, index) => (
              <ScrollReveal key={card.key} delayMs={index * 60} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                  <Icon as={card.icon} className="h-5 w-5 text-white" />
                </span>
                <h3 className="text-sm font-semibold">{t(`landing.forWho.cards.${card.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`landing.forWho.cards.${card.key}.description`)}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden bg-[#0e0a1a] px-6 py-24 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(700px_400px_at_50%_0%,rgba(192,38,211,0.35),transparent_60%)] marketing-glow" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.finalCta.title")}</h2>
          <p className="max-w-xl text-sm text-white/70 sm:text-base">{t("landing.finalCta.subtitle")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <MarketingButton href="/inscription" size="lg" icon={<IconArrowRight className="h-4 w-4" />}>
              {t("landing.finalCta.ctaPrimary")}
            </MarketingButton>
            <MarketingButton href="/solution" variant="outlineLight" size="lg">
              {t("landing.finalCta.ctaSecondary")}
            </MarketingButton>
          </div>
          <div className="mt-6 w-full max-w-2xl opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            <MockupPlaceholder
              src={undefined}
              alt="Aperçu du calendrier ClickPost"
              label="Aperçu calendrier"
              suggestedPath="/marketing/calendar.webp"
              aspectClassName="aspect-[21/9]"
              className="border-white/10 bg-white/5"
            />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
