"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import type { BrandIdentity } from "@/types/settings";

interface BrandIdentitySectionProps {
  identity: BrandIdentity;
  editable: boolean;
  onChange: (identity: BrandIdentity) => void;
  onReset: () => void;
}

export function BrandIdentitySection({ identity, editable, onChange, onReset }: BrandIdentitySectionProps) {
  const t = useTranslations();
  function set<K extends keyof BrandIdentity>(key: K, value: BrandIdentity[K]) {
    onChange({ ...identity, [key]: value });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">{t("settings.brandIdentity.title")}</h2>
        {editable && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline "
          >
            {t("settings.brandIdentity.resetButton")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.brandIdentity.primaryColorLabel")}
          <div className="flex items-center gap-2">
            <input
              type="color"
              disabled={!editable}
              value={identity.primaryColor}
              onChange={(event) => set("primaryColor", event.target.value)}
              className="h-9 w-14 rounded border border-border bg-surface  "
            />
            <span className="text-xs text-muted-foreground ">{identity.primaryColor}</span>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.brandIdentity.secondaryColorLabel")}
          <div className="flex items-center gap-2">
            <input
              type="color"
              disabled={!editable}
              value={identity.secondaryColor}
              onChange={(event) => set("secondaryColor", event.target.value)}
              className="h-9 w-14 rounded border border-border bg-surface  "
            />
            <span className="text-xs text-muted-foreground ">{identity.secondaryColor}</span>
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground ">
          {t("settings.brandIdentity.previewLabel")}
        </span>
        <div
          className="flex overflow-hidden rounded-lg border border-border "
          style={{ height: 120 }}
        >
          <div className="flex w-24 flex-col gap-2 p-3" style={{ backgroundColor: identity.primaryColor }}>
            <span className="h-2 w-12 rounded-full bg-white/70" />
            <span className="h-2 w-16 rounded-full bg-white/40" />
            <span className="h-2 w-10 rounded-full bg-white/40" />
          </div>
          <div className="flex flex-1 flex-col justify-between bg-white p-3 dark:bg-zinc-900">
            <div className="flex flex-col gap-1.5">
              <span className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <span className="h-2 w-32 rounded-full bg-muted " />
            </div>
            <span
              className="w-fit rounded-lg px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: identity.secondaryColor }}
            >
              {t("settings.brandIdentity.actionButtonPreview")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
