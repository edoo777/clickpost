"use client";

import { MarketingButton } from "@/components/marketing/MarketingButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { IconCheck } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { PRICING_FEATURE_CATEGORIES, PRICING_PLANS } from "@/lib/marketing/pricing-config";

function formatPrice(cents: number | null, freeLabel: string, unavailableLabel: string, suffix: string): string {
  if (cents === null) return unavailableLabel;
  if (cents === 0) return freeLabel;
  return `${(cents / 100).toFixed(0)} $${suffix}`;
}

export function PrixView() {
  const t = useTranslations();

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-border px-6 py-20 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(900px_450px_at_50%_-10%,rgba(124,58,237,0.16),transparent_60%),radial-gradient(600px_400px_at_100%_20%,rgba(37,99,235,0.1),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <SectionEyebrow>{t("pricing.eyebrow")}</SectionEyebrow>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("pricing.title")}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("pricing.subtitle")}</p>
        </div>
      </section>

      <section className="relative border-b border-border px-6 py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLANS.map((plan, index) => (
              <ScrollReveal
                key={plan.key}
                delayMs={index * 60}
                className={`flex flex-col gap-4 rounded-2xl border p-6 ${
                  plan.recommended
                    ? "relative border-transparent bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-fuchsia-500/25 lg:-translate-y-2"
                    : "border-border bg-surface"
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-violet-700 shadow">
                    {t("pricing.recommendedBadge")}
                  </span>
                )}
                <span className="text-sm font-semibold">{t(plan.nameKey)}</span>
                <span className="text-3xl font-semibold tracking-tight">
                  {formatPrice(plan.priceUsdCents, t("pricing.free"), t("pricing.priceUnavailable"), t("pricing.priceSuffix"))}
                </span>
                <p className={`text-xs ${plan.recommended ? "text-white/85" : "text-muted-foreground"}`}>{t(plan.descriptionKey)}</p>
                <MarketingButton
                  href={plan.priceUsdCents === null && plan.key === "agency" ? "/contact" : "/inscription"}
                  variant={plan.recommended ? "inverse" : "primary"}
                >
                  {plan.priceUsdCents === null && plan.key === "agency" ? t("pricing.contactSalesButton") : t("pricing.ctaButton")}
                </MarketingButton>
              </ScrollReveal>
            ))}
          </div>

          {/* Comparaison des fonctionnalités */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">&nbsp;</th>
                  {PRICING_PLANS.map((plan) => (
                    <th key={plan.key} className="px-4 py-3 text-center font-semibold">
                      {t(plan.nameKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_FEATURE_CATEGORIES.map((category) => (
                  <tr key={category.labelKey} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground/90">{t(category.labelKey)}</td>
                    {category.values.map((value, index) => (
                      <td key={PRICING_PLANS[index].key} className="px-4 py-3 text-center">
                        {value === "included" ? (
                          <IconCheck className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : value === "unavailable" ? (
                          <span className="text-muted-foreground">{t("pricing.valueUnavailable")}</span>
                        ) : value === null ? (
                          <span className="font-medium">{t("pricing.valueUnlimited")}</span>
                        ) : (
                          <span className="font-medium">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-xs text-muted-foreground">{t("pricing.notice")}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <SectionEyebrow>{t("pricing.faq.eyebrow")}</SectionEyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("pricing.faq.title")}</h2>
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">{t(`pricing.faq.items.${index}.question` as never)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.faq.items.${index}.answer` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
