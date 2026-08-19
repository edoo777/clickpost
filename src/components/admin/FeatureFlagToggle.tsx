"use client";

import { useState } from "react";
import type { FeatureFlag } from "@/lib/admin/feature-flag-types";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function FeatureFlagToggle({ flag }: { flag: FeatureFlag }) {
  const t = useTranslations();
  const [enabled, setEnabled] = useState(flag.enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleToggle() {
    const next = !enabled;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, enabled: next }),
      });
      const data = await response.json().catch(() => null);
      if (!data || data.status !== "ok") throw new Error(data?.message ?? t("admin.featureFlagToggle.unknownError"));
      setEnabled(next);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("admin.featureFlagToggle.unknownError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{flag.key}</span>
        {flag.description && <span className="text-xs text-muted-foreground">{flag.description}</span>}
        {errorMessage && <span className="text-xs text-red-600 dark:text-red-400">{errorMessage}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => void handleToggle()}
        disabled={isSaving}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          enabled ? "bg-violet-600" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
