"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "@/lib/i18n/locale-provider";
import { PRICING_PLANS } from "@/lib/marketing/pricing-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

interface BetaStatus {
  planKey: string;
  expiresAt: string;
}

interface SubscriptionSectionProps {
  editable: boolean;
}

/**
 * Redemption d'un code bêta temporaire (voir src/lib/billing/beta-codes.ts) — lecture directe de
 * `workspace_subscriptions` via le client navigateur (RLS : select par appartenance uniquement),
 * jamais d'écriture depuis le client : la validation du code passe exclusivement par
 * /api/billing/redeem-beta-code (service_role côté serveur).
 */
export function SubscriptionSection({ editable }: SubscriptionSectionProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const { workspace } = useWorkspaceSession();
  const [betaStatus, setBetaStatus] = useState<BetaStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      if (!workspace?.id) {
        setIsLoadingStatus(false);
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("workspace_subscriptions")
        .select("beta_plan_key, beta_expires_at")
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      if (cancelled) return;
      const row = data as { beta_plan_key: string | null; beta_expires_at: string | null } | null;
      const isActive = row?.beta_plan_key && row.beta_expires_at && new Date(row.beta_expires_at).getTime() > Date.now();
      setBetaStatus(isActive ? { planKey: row.beta_plan_key as string, expiresAt: row.beta_expires_at as string } : null);
      setIsLoadingStatus(false);
    }
    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [workspace?.id]);

  async function handleRedeem() {
    if (!workspace?.id || !code.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/billing/redeem-beta-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, code: code.trim() }),
      });
      const result = await response.json();
      if (result.status !== "ok") {
        setErrorMessage(t("settings.subscription.redeemError"));
        return;
      }
      setBetaStatus({ planKey: result.planKey, expiresAt: result.expiresAt });
      setCode("");
    } catch {
      setErrorMessage(t("settings.subscription.redeemError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const betaPlanNameKey = PRICING_PLANS.find((plan) => plan.key === betaStatus?.planKey)?.nameKey;
  const dateFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{t("settings.subscription.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("settings.subscription.description")}</p>
      </div>

      {!isLoadingStatus && betaStatus && (
        <p className="w-fit rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white">
          {t("settings.subscription.betaBadge", {
            plan: betaPlanNameKey ? t(betaPlanNameKey) : betaStatus.planKey,
            date: dateFormatter.format(new Date(betaStatus.expiresAt)),
          })}
        </p>
      )}

      {editable && !betaStatus && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t("settings.subscription.codePlaceholder")}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-400 focus:outline-none"
            />
            <button
              type="button"
              disabled={isSubmitting || !code.trim()}
              onClick={() => void handleRedeem()}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
            >
              {isSubmitting ? t("settings.subscription.redeeming") : t("settings.subscription.redeemButton")}
            </button>
          </div>
          {errorMessage && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMessage}</p>}
        </div>
      )}
    </section>
  );
}
