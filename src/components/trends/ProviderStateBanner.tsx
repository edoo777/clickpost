"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ProviderResultStatus } from "@/types/trend";

export function ProviderStateBanner({ status, message }: { status: Exclude<ProviderResultStatus, "ok">; message?: string }) {
  const t = useTranslations();
  const MESSAGES: Record<Exclude<ProviderResultStatus, "ok">, string> = {
    config_missing: t("trends.providerBanner.configMissing"),
    quota_exceeded: t("trends.providerBanner.quotaExceeded"),
    unavailable: t("trends.providerBanner.unavailable"),
    error: t("trends.providerBanner.error"),
  };
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
      {message ?? MESSAGES[status]}
    </div>
  );
}
