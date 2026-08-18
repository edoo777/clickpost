"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS, TIME_ZONE_OPTIONS } from "@/lib/settings-data";
import type { AgencyInfo } from "@/types/settings";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-background disabled:text-zinc-500   dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

interface AgencyInfoSectionProps {
  info: AgencyInfo;
  editable: boolean;
  onChange: (info: AgencyInfo) => void;
}

export function AgencyInfoSection({ info, editable, onChange }: AgencyInfoSectionProps) {
  const t = useTranslations();
  function set<K extends keyof AgencyInfo>(key: K, value: AgencyInfo[K]) {
    onChange({ ...info, [key]: value });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{t("settings.agencyInfo.title")}</h2>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-black">
          {info.logoLabel || "?"}
        </span>
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.logoLabel")}
          <input
            disabled={!editable}
            value={info.logoLabel}
            maxLength={3}
            onChange={(event) => set("logoLabel", event.target.value.toUpperCase())}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.nameLabel")}
          <input disabled={!editable} value={info.name} onChange={(event) => set("name", event.target.value)} className={INPUT_CLASS} />
          <span className="text-xs font-normal text-muted-foreground">
            {t("settings.agencyInfo.nameHint")}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.websiteLabel")}
          <input disabled={!editable} value={info.website} onChange={(event) => set("website", event.target.value)} className={INPUT_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.emailLabel")}
          <input
            type="email"
            disabled={!editable}
            value={info.email}
            onChange={(event) => set("email", event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.phoneLabel")}
          <input disabled={!editable} value={info.phone} onChange={(event) => set("phone", event.target.value)} className={INPUT_CLASS} />
        </label>

        <div className="md:col-span-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("settings.agencyInfo.addressLabel")}
            <input
              disabled={!editable}
              value={info.address}
              onChange={(event) => set("address", event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.countryLabel")}
          <select disabled={!editable} value={info.country} onChange={(event) => set("country", event.target.value)} className={INPUT_CLASS}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.defaultLanguageLabel")}
          <select
            disabled={!editable}
            value={info.defaultLanguage}
            onChange={(event) => set("defaultLanguage", event.target.value)}
            className={INPUT_CLASS}
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.agencyInfo.defaultTimeZoneLabel")}
          <select
            disabled={!editable}
            value={info.defaultTimeZone}
            onChange={(event) => set("defaultTimeZone", event.target.value)}
            className={INPUT_CLASS}
          >
            {TIME_ZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
