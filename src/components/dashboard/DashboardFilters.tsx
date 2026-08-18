"use client";

import { useBrandsSession } from "@/lib/brands-store";
import { CONTENT_FORMATS, useFormatLabel } from "@/lib/editorial-constants";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePlatformLabel, useStatusLabel } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { PublicationStatus } from "@/types/publication";

export type DashboardPeriod = "7" | "30" | "90";

export interface DashboardFiltersValue {
  brandId: string | "all";
  platform: SocialPlatform | "all";
  period: DashboardPeriod;
  status: PublicationStatus | "all";
  format: ContentFormat | "all";
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFiltersValue = {
  brandId: "all",
  platform: "all",
  period: "30",
  status: "all",
  format: "all",
};

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];

const ALL_STATUSES: PublicationStatus[] = [
  "idea",
  "to_develop",
  "content_generated",
  "draft",
  "in_production",
  "in_review",
  "needs_changes",
  "pending_client",
  "approved",
  "ready_to_schedule",
  "scheduled",
  "published",
  "failed",
  "rejected",
];

const FIELD_CLASS =
  "rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200   dark:text-zinc-300 dark:focus:ring-violet-500/20";

interface DashboardFiltersProps {
  value: DashboardFiltersValue;
  onChange: (value: DashboardFiltersValue) => void;
}

export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const FORMAT_LABEL = useFormatLabel();
  const PLATFORM_LABEL = usePlatformLabel();
  const STATUS_LABEL = useStatusLabel();
  const isDefault =
    value.brandId === "all" &&
    value.platform === "all" &&
    value.status === "all" &&
    value.format === "all" &&
    value.period === "30";

  return (
    <div
      aria-label={t("dashboard.filtersLabel")}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm  "
    >
      <select
        value={value.brandId}
        onChange={(event) => onChange({ ...value, brandId: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("dashboard.allBrands")}</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>

      <select
        value={value.platform}
        onChange={(event) => onChange({ ...value, platform: event.target.value as SocialPlatform | "all" })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("dashboard.allNetworks")}</option>
        {ALL_PLATFORMS.map((platform) => (
          <option key={platform} value={platform}>
            {PLATFORM_LABEL[platform]}
          </option>
        ))}
      </select>

      <select
        value={value.period}
        onChange={(event) => onChange({ ...value, period: event.target.value as DashboardPeriod })}
        className={FIELD_CLASS}
      >
        <option value="7">{t("dashboard.last7Days")}</option>
        <option value="30">{t("dashboard.last30Days")}</option>
        <option value="90">{t("dashboard.last90Days")}</option>
      </select>

      <select
        value={value.status}
        onChange={(event) => onChange({ ...value, status: event.target.value as PublicationStatus | "all" })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("dashboard.allStatuses")}</option>
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        value={value.format}
        onChange={(event) => onChange({ ...value, format: event.target.value as ContentFormat | "all" })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("dashboard.allFormats")}</option>
        {CONTENT_FORMATS.map((format) => (
          <option key={format} value={format}>
            {FORMAT_LABEL[format]}
          </option>
        ))}
      </select>

      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_DASHBOARD_FILTERS)}
          className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          {t("dashboard.resetFilters")}
        </button>
      )}
    </div>
  );
}
