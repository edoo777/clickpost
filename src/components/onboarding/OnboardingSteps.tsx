"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ProfileRow, UsageType, WorkspaceBrandingRow, WorkspaceRow } from "@/lib/supabase/types";

export const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:text-zinc-200";
export const LABEL_CLASS = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const CONTENT_GOAL_OPTIONS = [
  "Notoriété de marque",
  "Engagement communautaire",
  "Génération de prospects",
  "Fidélisation client",
  "Vente directe",
  "Recrutement",
];

function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
          : "border-border bg-surface text-zinc-600 hover:border-violet-200 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:text-violet-300"
      }`}
    >
      {label}
    </button>
  );
}

export interface StepProps {
  profile: ProfileRow;
  workspace: WorkspaceRow;
  onProfileChange: <K extends keyof ProfileRow>(key: K, value: ProfileRow[K]) => void;
  onWorkspaceChange: <K extends keyof WorkspaceRow>(key: K, value: WorkspaceRow[K]) => void;
}

export function PersonalInfoStep({ profile, onProfileChange }: StepProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          {t("onboarding.personalInfo.firstName")}
          <input
            value={profile.first_name}
            onChange={(event) => onProfileChange("first_name", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <label className={LABEL_CLASS}>
          {t("onboarding.personalInfo.lastName")}
          <input
            value={profile.last_name}
            onChange={(event) => onProfileChange("last_name", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
      </div>
      <label className={LABEL_CLASS}>
        {t("onboarding.personalInfo.jobTitle")}
        <input
          value={profile.job_title ?? ""}
          onChange={(event) => onProfileChange("job_title", event.target.value)}
          className={FIELD_CLASS}
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          {t("onboarding.personalInfo.preferredLanguage")}
          <input
            value={profile.language}
            onChange={(event) => onProfileChange("language", event.target.value)}
            placeholder="Français"
            className={FIELD_CLASS}
          />
        </label>
        <label className={LABEL_CLASS}>
          {t("onboarding.personalInfo.timeZone")}
          <input
            value={profile.time_zone}
            onChange={(event) => onProfileChange("time_zone", event.target.value)}
            placeholder="America/Montreal"
            className={FIELD_CLASS}
          />
        </label>
      </div>
    </div>
  );
}

export function WorkspaceNameStep({ workspace, onWorkspaceChange }: StepProps) {
  const t = useTranslations();
  return (
    <label className={LABEL_CLASS}>
      {t("onboarding.workspaceName.label")}
      <input
        value={workspace.name}
        onChange={(event) => onWorkspaceChange("name", event.target.value)}
        className={FIELD_CLASS}
      />
      <span className="text-xs font-normal text-muted-foreground">{t("onboarding.workspaceName.hint")}</span>
    </label>
  );
}

const USAGE_TYPES: { value: UsageType; labelKey: "solo" | "team" | "agency" }[] = [
  { value: "solo", labelKey: "solo" },
  { value: "team", labelKey: "team" },
  { value: "agency", labelKey: "agency" },
];

export function UsageTypeStep({ workspace, onWorkspaceChange }: StepProps) {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {USAGE_TYPES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onWorkspaceChange("usage_type", option.value)}
          aria-pressed={workspace.usage_type === option.value}
          className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
            workspace.usage_type === option.value
              ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-500/10"
              : "border-border bg-surface hover:border-violet-200 dark:hover:border-violet-500/30"
          }`}
        >
          <span className="text-sm font-semibold text-foreground">{t(`onboarding.usageType.${option.labelKey}.label`)}</span>
          <span className="text-xs text-muted-foreground">{t(`onboarding.usageType.${option.labelKey}.description`)}</span>
        </button>
      ))}
    </div>
  );
}

export function CompanyStep({ workspace, onWorkspaceChange }: StepProps) {
  const t = useTranslations();
  return (
    <label className={LABEL_CLASS}>
      {t("onboarding.company.label")}
      <input
        value={workspace.company_name ?? ""}
        onChange={(event) => onWorkspaceChange("company_name", event.target.value)}
        className={FIELD_CLASS}
      />
    </label>
  );
}

export function IndustryStep({ workspace, onWorkspaceChange }: StepProps) {
  const t = useTranslations();
  return (
    <label className={LABEL_CLASS}>
      {t("onboarding.industry.label")}
      <input
        value={workspace.industry ?? ""}
        onChange={(event) => onWorkspaceChange("industry", event.target.value)}
        placeholder={t("onboarding.industry.placeholder")}
        className={FIELD_CLASS}
      />
    </label>
  );
}

export function PlatformsStep({ workspace, onWorkspaceChange }: StepProps) {
  const t = useTranslations();
  function toggle(platform: SocialPlatform) {
    const next = workspace.social_platforms.includes(platform)
      ? workspace.social_platforms.filter((p) => p !== platform)
      : [...workspace.social_platforms, platform];
    onWorkspaceChange("social_platforms", next);
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("onboarding.platforms.hint")}</p>
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((platform) => (
          <ToggleChip
            key={platform}
            label={PLATFORM_LABEL[platform]}
            active={workspace.social_platforms.includes(platform)}
            onClick={() => toggle(platform)}
          />
        ))}
      </div>
    </div>
  );
}

export function GoalsStep({ workspace, onWorkspaceChange }: StepProps) {
  const t = useTranslations();
  function toggle(goal: string) {
    const next = workspace.content_goals.includes(goal)
      ? workspace.content_goals.filter((g) => g !== goal)
      : [...workspace.content_goals, goal];
    onWorkspaceChange("content_goals", next);
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("onboarding.goals.hint")}</p>
      <div className="flex flex-wrap gap-2">
        {CONTENT_GOAL_OPTIONS.map((goal) => (
          <ToggleChip key={goal} label={goal} active={workspace.content_goals.includes(goal)} onClick={() => toggle(goal)} />
        ))}
      </div>
    </div>
  );
}

interface BrandingStepProps {
  branding: WorkspaceBrandingRow;
  onBrandingChange: <K extends keyof WorkspaceBrandingRow>(key: K, value: WorkspaceBrandingRow[K]) => void;
}

export function BrandingStep({ branding, onBrandingChange }: BrandingStepProps) {
  const t = useTranslations();
  const fields: { key: "color_primary" | "color_secondary" | "color_accent"; labelKey: "primaryColor" | "secondaryColor" | "accentColor" }[] = [
    { key: "color_primary", labelKey: "primaryColor" },
    { key: "color_secondary", labelKey: "secondaryColor" },
    { key: "color_accent", labelKey: "accentColor" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("onboarding.branding.hint")}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fields.map((field) => {
          const label = t(`onboarding.branding.${field.labelKey}`);
          return (
            <label key={field.key} className={LABEL_CLASS}>
              {label}
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding[field.key]}
                  onChange={(event) => onBrandingChange(field.key, event.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
                  aria-label={label}
                />
                <input
                  value={branding[field.key]}
                  onChange={(event) => onBrandingChange(field.key, event.target.value)}
                  className={FIELD_CLASS}
                />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function ConfirmationStep({ profile, workspace }: StepProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">
        {t("onboarding.confirmation.intro", { name: profile.first_name || t("onboarding.confirmation.fallbackName") })}
      </p>
      <dl className="flex flex-col gap-2 rounded-xl border border-border bg-muted p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("onboarding.confirmation.workspaceLabel")}</dt>
          <dd className="font-medium text-foreground">{workspace.name}</dd>
        </div>
        {workspace.company_name && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("onboarding.confirmation.companyLabel")}</dt>
            <dd className="font-medium text-foreground">{workspace.company_name}</dd>
          </div>
        )}
        {workspace.social_platforms.length > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("onboarding.confirmation.platformsLabel")}</dt>
            <dd className="font-medium text-foreground">
              {workspace.social_platforms.map((platform) => PLATFORM_LABEL[platform as SocialPlatform]).join(", ")}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
