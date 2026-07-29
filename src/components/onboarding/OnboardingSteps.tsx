"use client";

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
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          Prénom
          <input
            value={profile.first_name}
            onChange={(event) => onProfileChange("first_name", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <label className={LABEL_CLASS}>
          Nom
          <input
            value={profile.last_name}
            onChange={(event) => onProfileChange("last_name", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
      </div>
      <label className={LABEL_CLASS}>
        Fonction ou poste (facultatif)
        <input
          value={profile.job_title ?? ""}
          onChange={(event) => onProfileChange("job_title", event.target.value)}
          className={FIELD_CLASS}
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          Langue préférée
          <input
            value={profile.language}
            onChange={(event) => onProfileChange("language", event.target.value)}
            placeholder="Français"
            className={FIELD_CLASS}
          />
        </label>
        <label className={LABEL_CLASS}>
          Fuseau horaire
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
  return (
    <label className={LABEL_CLASS}>
      Nom de l&apos;espace de travail
      <input
        value={workspace.name}
        onChange={(event) => onWorkspaceChange("name", event.target.value)}
        className={FIELD_CLASS}
      />
      <span className="text-xs font-normal text-muted-foreground">
        Visible par tous les membres de votre équipe. Vous pourrez le modifier à tout moment.
      </span>
    </label>
  );
}

const USAGE_TYPES: { value: UsageType; label: string; description: string }[] = [
  { value: "solo", label: "Créateur solo", description: "Je gère seul(e) mes contenus." },
  { value: "team", label: "Équipe marketing", description: "Nous sommes plusieurs à collaborer en interne." },
  { value: "agency", label: "Agence", description: "Nous gérons du contenu pour plusieurs clients." },
];

export function UsageTypeStep({ workspace, onWorkspaceChange }: StepProps) {
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
          <span className="text-sm font-semibold text-foreground">{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  );
}

export function CompanyStep({ workspace, onWorkspaceChange }: StepProps) {
  return (
    <label className={LABEL_CLASS}>
      Nom de l&apos;entreprise ou de la marque
      <input
        value={workspace.company_name ?? ""}
        onChange={(event) => onWorkspaceChange("company_name", event.target.value)}
        className={FIELD_CLASS}
      />
    </label>
  );
}

export function IndustryStep({ workspace, onWorkspaceChange }: StepProps) {
  return (
    <label className={LABEL_CLASS}>
      Secteur d&apos;activité
      <input
        value={workspace.industry ?? ""}
        onChange={(event) => onWorkspaceChange("industry", event.target.value)}
        placeholder="Ex. Cosmétique, conseil, alimentation…"
        className={FIELD_CLASS}
      />
    </label>
  );
}

export function PlatformsStep({ workspace, onWorkspaceChange }: StepProps) {
  function toggle(platform: SocialPlatform) {
    const next = workspace.social_platforms.includes(platform)
      ? workspace.social_platforms.filter((p) => p !== platform)
      : [...workspace.social_platforms, platform];
    onWorkspaceChange("social_platforms", next);
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Sélectionnez les réseaux sociaux que vous utilisez.</p>
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
  function toggle(goal: string) {
    const next = workspace.content_goals.includes(goal)
      ? workspace.content_goals.filter((g) => g !== goal)
      : [...workspace.content_goals, goal];
    onWorkspaceChange("content_goals", next);
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Quels sont vos objectifs de contenu ?</p>
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
  const fields: { key: "color_primary" | "color_secondary" | "color_accent"; label: string }[] = [
    { key: "color_primary", label: "Couleur principale" },
    { key: "color_secondary", label: "Couleur secondaire" },
    { key: "color_accent", label: "Couleur d'accent" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Personnalisez les couleurs de base de votre espace. Vous pourrez affiner l&apos;identité visuelle complète
        (typographie, sidebar, arrondis…) plus tard depuis Paramètres → Identité visuelle.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className={LABEL_CLASS}>
            {field.label}
            <span className="flex items-center gap-2">
              <input
                type="color"
                value={branding[field.key]}
                onChange={(event) => onBrandingChange(field.key, event.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
                aria-label={field.label}
              />
              <input
                value={branding[field.key]}
                onChange={(event) => onBrandingChange(field.key, event.target.value)}
                className={FIELD_CLASS}
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function ConfirmationStep({ profile, workspace }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">
        Tout est prêt, <strong>{profile.first_name || "vous"}</strong> ! Voici un résumé de votre espace :
      </p>
      <dl className="flex flex-col gap-2 rounded-xl border border-border bg-muted p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Espace de travail</dt>
          <dd className="font-medium text-foreground">{workspace.name}</dd>
        </div>
        {workspace.company_name && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Entreprise</dt>
            <dd className="font-medium text-foreground">{workspace.company_name}</dd>
          </div>
        )}
        {workspace.social_platforms.length > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Réseaux</dt>
            <dd className="font-medium text-foreground">
              {workspace.social_platforms.map((platform) => PLATFORM_LABEL[platform as SocialPlatform]).join(", ")}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
