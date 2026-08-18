"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { fetchWebSearchStatus } from "@/lib/trends/client";
import type { WebSearchQuotaStatus, WebSearchUsageSnapshot } from "@/types/trend";

/**
 * Suivi de coût sans exposer de secret ni de coût monétaire exact (non fourni par l'API) —
 * uniquement des compteurs. Rafraîchi après chaque recherche via `refreshKey`. Section 11 :
 * recherches utilisées/restantes, heure de réinitialisation, utilisation du cache, erreurs.
 */
export function WebSearchQuotaPanel({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations();
  const [quota, setQuota] = useState<WebSearchQuotaStatus | null>(null);
  const [usage, setUsage] = useState<WebSearchUsageSnapshot | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const status = await fetchWebSearchStatus({ mode: "global", focus: "platform_trends", period: "7d" });
      if (!isMountedRef.current) return;
      if (status.status === "ok") {
        setQuota(status.quota ?? null);
        setUsage(status.usage ?? null);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [refreshKey]);

  if (!quota || !usage) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-[11px] text-muted-foreground">
      <p className="font-medium text-foreground">{t("trends.quotaPanel.title")}</p>
      <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        <div>
          <dt>{t("trends.quotaPanel.searchesToday")}</dt>
          <dd className="font-medium text-foreground">{usage.searchesUsedToday}</dd>
        </div>
        <div>
          <dt>{t("trends.quotaPanel.cacheHitsToday")}</dt>
          <dd className="font-medium text-foreground">{usage.cacheHitsToday}</dd>
        </div>
        <div>
          <dt>{t("trends.quotaPanel.providerErrorsToday")}</dt>
          <dd className="font-medium text-foreground">{usage.providerErrorsToday}</dd>
        </div>
        <div>
          <dt>{t("trends.quotaPanel.globalRemaining")}</dt>
          <dd className="font-medium text-foreground">
            {quota.global.remaining}/{quota.global.limit}
          </dd>
        </div>
      </dl>
    </div>
  );
}
