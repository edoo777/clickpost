"use client";

import { AiGenerationMockup } from "@/components/marketing/AiGenerationMockup";
import { CalendarMockup } from "@/components/marketing/CalendarMockup";
import { FloatingBadge } from "@/components/marketing/FloatingBadge";
import { HumanPlaceholder, type HumanPersona } from "@/components/marketing/HumanPlaceholder";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PublishFlowMockup } from "@/components/marketing/PublishFlowMockup";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { VideoPlayer } from "@/components/marketing/VideoPlayer";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconLightbulb,
  IconLinkedin,
  IconSparkles,
  IconTiktok,
  IconWand,
} from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

const FOR_WHO_CARDS: { key: "creators" | "entrepreneurs" | "consultants" | "agencies" | "marketingTeams"; persona: HumanPersona }[] = [
  { key: "creators", persona: "creatorCamera" },
  { key: "entrepreneurs", persona: "entrepreneurContent" },
  { key: "consultants", persona: "consultant" },
  { key: "agencies", persona: "marketingTeam" },
  { key: "marketingTeams", persona: "socialMediaManager" },
];

/**
 * Page d'accueil du site public — direction artistique enrichie (voir le mandat) : rythme de
 * sections blanc → dégradé léger → sombre spectaculaire → blanc produit → violet immersif →
 * humain → CTA sombre, présence humaine réelle (HumanPlaceholder) plutôt que des icônes seules,
 * compositions produit reconstruites en CSS/SVG (jamais d'image médiocre ou non pertinente).
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
    rows: heroRows,
  };

  const beforeItems = Array.from({ length: 6 }, (_, i) => t(`landing.excel.beforeItems.${i}` as never));
  const afterSteps = Array.from({ length: 5 }, (_, i) => t(`landing.excel.afterSteps.${i}` as never));
  const calendarBullets = Array.from({ length: 12 }, (_, i) => t(`landing.calendarSection.bullets.${i}` as never));
  const aiCapabilities = Array.from({ length: 9 }, (_, i) => t(`landing.ai.capabilities.${i}` as never));
  const workflowSteps = Array.from({ length: 6 }, (_, i) => t(`landing.workflow.steps.${i}` as never));
  const ideaBankTopics = Array.from({ length: 5 }, (_, i) => t(`landing.ideaBank.exampleTopics.${i}` as never));

  return (
    <MarketingShell>
      {/* HERO — section blanche, calendrier dominant + cartes flottantes */}
      <section className="relative overflow-hidden border-b border-border px-6 pb-28 pt-16 sm:pt-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(1000px_500px_at_20%_-10%,rgba(124,58,237,0.14),transparent_60%),radial-gradient(800px_500px_at_100%_10%,rgba(192,38,211,0.12),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col items-start gap-6 text-left">
            <SectionEyebrow>{t("landing.hero.eyebrow")}</SectionEyebrow>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              <span className="block bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {t("landing.hero.kicker")}
              </span>
              {t("landing.hero.titleLine")} {t("landing.hero.titleHighlight")}
            </h1>
            <p className="max-w-lg text-base text-muted-foreground sm:text-lg">{t("landing.hero.subtitle")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <MarketingButton href="/inscription" size="lg" icon={<IconArrowRight className="h-4 w-4" />}>
                {t("landing.hero.ctaPrimary")}
              </MarketingButton>
              <MarketingButton href="#demo" variant="secondary" size="lg">
                {t("landing.hero.ctaSecondary")}
              </MarketingButton>
            </div>
            <p className="text-xs text-muted-foreground">{t("landing.hero.note")}</p>
          </div>

          <div className="relative px-2 lg:px-6">
            <CalendarMockup labels={calendarLabels} liveRowIndex={2} />
            <FloatingBadge icon={<IconCalendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />} position="top-left" floatVariant={0}>
              {t("landing.hero.floating.planned")}
            </FloatingBadge>
            <FloatingBadge icon={<IconWand className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />} position="top-right" tone="accent" floatVariant={1}>
              {t("landing.hero.floating.scriptReady")}
            </FloatingBadge>
            <FloatingBadge icon={<IconTiktok className="h-4 w-4" />} position="mid-left" floatVariant={2}>
              {t("landing.hero.floating.tiktokSlot")}
            </FloatingBadge>
            <FloatingBadge icon={<IconLinkedin className="h-4 w-4 text-sky-600" />} position="bottom-right" floatVariant={0}>
              {t("landing.hero.floating.linkedinSlot")}
            </FloatingBadge>
            <FloatingBadge icon={<IconLightbulb className="h-4 w-4 text-amber-500" />} position="bottom-left" tone="success" floatVariant={1}>
              {t("landing.hero.floating.ideaSaved")}
            </FloatingBadge>
          </div>
        </div>
      </section>

      {/* FINI EXCEL — dégradé léger */}
      <section className="border-b border-border bg-gradient-to-b from-violet-50 via-fuchsia-50/40 to-transparent px-6 py-20 dark:from-violet-500/[.08] dark:via-fuchsia-500/[.03]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.excel.eyebrow")}</SectionEyebrow>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.excel.title")}</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <ScrollReveal className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-sm">
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

            <ScrollReveal delayMs={120} className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-blue-600 p-6 text-white shadow-xl shadow-fuchsia-500/20">
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

          <ScrollReveal className="flex flex-col items-center gap-1 text-center">
            <p className="text-lg font-semibold tracking-tight sm:text-xl">{t("landing.excel.message")}</p>
            <p className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
              {t("landing.excel.strongMessage")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* CALENDRIER INTELLIGENT — sombre spectaculaire, LA fonctionnalité star */}
      <section id="fonctionnalites" className="marketing-section-dark overflow-hidden border-b border-white/10 px-6 py-24">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12">
          <ScrollReveal className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">{t("landing.calendarSection.eyebrow")}</span>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t("landing.calendarSection.title")}</h2>
            <p className="text-base font-semibold text-white/90">{t("landing.calendarSection.message1")}</p>
          </ScrollReveal>

          <ScrollReveal delayMs={100}>
            <CalendarMockup labels={calendarLabels} variant="spectacular" liveRowIndex={1} className="mx-auto max-w-4xl" />
          </ScrollReveal>

          <ScrollReveal delayMs={150} className="mx-auto grid max-w-3xl grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            {calendarBullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-2 text-sm text-white/80">
                <IconCheck className="h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
                {bullet}
              </div>
            ))}
          </ScrollReveal>

          <p className="mx-auto max-w-xl text-center text-sm text-white/60">{t("landing.calendarSection.message2")}</p>
        </div>
      </section>

      {/* VIDÉO PRODUIT — blanche, interface produit */}
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

      {/* BANQUE D'IDÉES — organisation/stockage, priorité #2 */}
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
              <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
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

      {/* IA COPILOTE — violet immersif, priorité #3 */}
      <section className="marketing-section-violet overflow-hidden border-b border-white/10 px-6 py-24">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">{t("landing.ai.eyebrow")}</span>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t("landing.ai.title")}</h2>
            <p className="max-w-xl text-sm text-white/80 sm:text-base">{t("landing.ai.subtitle")}</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <ScrollReveal delayMs={80}>
              <AiGenerationMockup
                prompt={t("solution.mockups.generate.prompt")}
                topics={Array.from({ length: 3 }, (_, i) => t(`solution.mockups.generate.topics.${i}` as never))}
              />
            </ScrollReveal>
            <ScrollReveal delayMs={140} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
              {aiCapabilities.map((capability) => (
                <div key={capability} className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
                  <IconSparkles className="h-4 w-4 shrink-0 text-fuchsia-200" />
                  {capability}
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* WORKFLOW — blanche */}
      <section className="border-b border-border px-6 py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.workflow.eyebrow")}</SectionEyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.workflow.title")}</h2>
          </ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    index === 0
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
                      : "border border-violet-200 bg-surface dark:border-violet-500/30"
                  }`}
                >
                  {step}
                </span>
                {index < workflowSteps.length - 1 && <IconArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MULTI-RÉSEAUX — dégradé léger, priorité #4 */}
      <section className="border-b border-border bg-gradient-to-b from-blue-50/50 via-violet-50/40 to-transparent px-6 py-20 dark:from-blue-500/[.05] dark:via-violet-500/[.05]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
          <SectionEyebrow>{t("landing.multiNetwork.eyebrow")}</SectionEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.multiNetwork.title")}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{t("landing.multiNetwork.description")}</p>
          <ScrollReveal className="w-full">
            <PublishFlowMockup className="mx-auto max-w-2xl" />
          </ScrollReveal>
          <p className="max-w-xl text-xs text-muted-foreground">{t("landing.multiNetwork.disclaimer")}</p>
        </div>
      </section>

      {/* PRÉSENCE HUMAINE / POUR QUI — section humaine */}
      <section className="border-b border-border px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ScrollReveal className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("landing.forWho.eyebrow")}</SectionEyebrow>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.forWho.humanTagline")}</h2>
            <p className="text-base text-muted-foreground">{t("landing.forWho.title")}</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {FOR_WHO_CARDS.map((card, index) => (
              <ScrollReveal key={card.key} delayMs={index * 60} className="flex flex-col gap-3">
                <HumanPlaceholder
                  persona={card.persona}
                  alt={t(`landing.forWho.cards.${card.key}.title`)}
                  label={t(`landing.forWho.cards.${card.key}.title`)}
                  suggestedPath={`/marketing/${card.persona}.webp`}
                />
                <p className="text-xs text-muted-foreground">{t(`landing.forWho.cards.${card.key}.description`)}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL — sombre spectaculaire */}
      <section className="marketing-section-dark relative overflow-hidden px-6 py-24 text-white">
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
          <div className="mt-8 w-full max-w-2xl opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            <CalendarMockup labels={calendarLabels} className="pointer-events-none" />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
