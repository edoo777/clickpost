"use client";

import { CalendarMockup } from "@/components/marketing/CalendarMockup";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MockupPlaceholder } from "@/components/marketing/MockupPlaceholder";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { IconArrowRight } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

const STEPS = ["capture", "generate", "create", "organize", "plan", "publish", "measure"] as const;

const STEP_ASSET: Record<(typeof STEPS)[number], string> = {
  capture: "/marketing/idea-bank.webp",
  generate: "/marketing/topic-generator.webp",
  create: "/marketing/workshop.webp",
  organize: "/marketing/idea-bank-organized.webp",
  plan: "/marketing/calendar.webp",
  publish: "/marketing/publish.webp",
  measure: "/marketing/reports.webp",
};

export function SolutionView() {
  const t = useTranslations();

  const heroRows = [
    { title: "Idée générée automatiquement", platform: "instagram" as const, date: "3 avril", time: "09:00", status: "idea" as const },
    { title: "Script prêt à réviser", platform: "linkedin" as const, date: "5 avril", time: "08:00", status: "ready" as const },
    { title: "Publication planifiée", platform: "youtube" as const, date: "7 avril", time: "17:00", status: "scheduled" as const },
  ];

  return (
    <MarketingShell>
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

      <div className="flex flex-col">
        {STEPS.map((step, index) => (
          <section key={step} className={`border-b border-border px-6 py-16 ${index % 2 === 1 ? "bg-muted/40" : ""}`}>
            <div
              className={`mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2 ${
                index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <ScrollReveal className="flex flex-col gap-4">
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t(`solution.steps.${step}.number`)}</span>
                <h2 className="text-3xl font-semibold tracking-tight">{t(`solution.steps.${step}.title`)}</h2>
                <p className="max-w-md text-base text-muted-foreground">{t(`solution.steps.${step}.description`)}</p>
              </ScrollReveal>

              <ScrollReveal delayMs={100}>
                {step === "plan" || step === "publish" ? (
                  <CalendarMockup
                    labels={{
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
                    }}
                    className="mx-auto max-w-lg"
                  />
                ) : (
                  <MockupPlaceholder
                    alt={t(`solution.steps.${step}.title`)}
                    label={t(`solution.steps.${step}.title`)}
                    suggestedPath={STEP_ASSET[step]}
                    className="mx-auto max-w-lg"
                  />
                )}
              </ScrollReveal>
            </div>
          </section>
        ))}
      </div>

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
