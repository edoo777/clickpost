"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconLogoMark } from "@/components/icons";
import {
  BrandingStep,
  CompanyStep,
  ConfirmationStep,
  GoalsStep,
  IndustryStep,
  PersonalInfoStep,
  PlatformsStep,
  UsageTypeStep,
  WorkspaceNameStep,
} from "@/components/onboarding/OnboardingSteps";
import { WorkspaceErrorNotice } from "@/components/shared/WorkspaceErrorNotice";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { ProfileRow, WorkspaceBrandingRow, WorkspaceRow } from "@/lib/supabase/types";

const STEP_TITLE_KEYS: TranslationKey[] = [
  "onboarding.steps.personalInfo",
  "onboarding.steps.workspaceName",
  "onboarding.steps.usageType",
  "onboarding.steps.company",
  "onboarding.steps.industry",
  "onboarding.steps.platforms",
  "onboarding.steps.goals",
  "onboarding.steps.branding",
  "onboarding.steps.confirmation",
];

const TOTAL_STEPS = STEP_TITLE_KEYS.length;

interface OnboardingViewProps {
  /** Texte configurable depuis l'espace Admin (voir src/lib/admin/product-texts.ts) — valeur par
   * défaut déjà appliquée côté serveur si rien n'a été personnalisé. */
  welcomeTitle: string;
  welcomeSubtitle: string;
}

export function OnboardingView({ welcomeTitle, welcomeSubtitle }: OnboardingViewProps) {
  const router = useRouter();
  const t = useTranslations();
  const { profile, workspace, branding, isLoading, workspaceError, updateProfile, updateWorkspace, updateBranding, refresh } =
    useWorkspaceSession();

  const [step, setStep] = useState(1);
  const [draftProfile, setDraftProfile] = useState<ProfileRow | null>(null);
  const [draftWorkspace, setDraftWorkspace] = useState<WorkspaceRow | null>(null);
  const [draftBranding, setDraftBranding] = useState<WorkspaceBrandingRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializedFromId, setInitializedFromId] = useState<string | null>(null);

  // Initialise l'état local depuis les données chargées une seule fois (motif d'ajustement
  // pendant le rendu recommandé par React, pas un effet) — dès que profil/workspace arrivent.
  if (!initializedFromId && profile && workspace) {
    setInitializedFromId(profile.id);
    setDraftProfile(profile);
    setDraftWorkspace(workspace);
    setDraftBranding(branding);
    setStep(Math.min(Math.max(workspace.onboarding_step, 1), TOTAL_STEPS));
  }
  const hasInitialized = Boolean(initializedFromId);
  const isAlreadyOnboarded = hasInitialized && Boolean(workspace?.onboarding_completed);

  // Un utilisateur déjà onboardé (favori, bouton précédent, URL tapée directement) ne doit
  // jamais revoir l'assistant — « une seule fois, jamais redemandée aux connexions suivantes »
  // (voir docs/tests-manuels.md). `handleComplete` reste idempotent si jamais atteint entre-temps.
  useEffect(() => {
    if (isAlreadyOnboarded) router.replace("/");
  }, [isAlreadyOnboarded, router]);

  // Un échec de chargement du workspace (RPC ensure_default_workspace, réseau...) ne doit jamais
  // laisser un nouvel utilisateur bloqué sur un spinner infini sans message ni moyen de réessayer
  // — même traitement que /marques et les paramètres (voir WorkspaceErrorNotice).
  if (!isLoading && workspaceError && !hasInitialized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <WorkspaceErrorNotice error={workspaceError} onRetry={refresh} />
        </div>
      </div>
    );
  }

  if (isLoading || !hasInitialized || !draftProfile || !draftWorkspace || !draftBranding || isAlreadyOnboarded) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{isAlreadyOnboarded ? t("onboarding.redirecting") : t("onboarding.loading")}</p>
      </div>
    );
  }

  function handleProfileChange<K extends keyof ProfileRow>(key: K, value: ProfileRow[K]) {
    setDraftProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }
  function handleWorkspaceChange<K extends keyof WorkspaceRow>(key: K, value: WorkspaceRow[K]) {
    setDraftWorkspace((prev) => (prev ? { ...prev, [key]: value } : prev));
  }
  function handleBrandingChange<K extends keyof WorkspaceBrandingRow>(key: K, value: WorkspaceBrandingRow[K]) {
    setDraftBranding((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function persistCurrentStep(nextStep: number): Promise<boolean> {
    setErrorMessage(null);
    if (step === 2 && !draftWorkspace!.name.trim()) {
      setErrorMessage(t("onboarding.workspaceNameRequired"));
      return false;
    }

    setIsSaving(true);
    const results = await Promise.all([
      updateProfile({
        first_name: draftProfile!.first_name,
        last_name: draftProfile!.last_name,
        job_title: draftProfile!.job_title,
        language: draftProfile!.language,
        time_zone: draftProfile!.time_zone,
      }),
      updateWorkspace({
        name: draftWorkspace!.name,
        usage_type: draftWorkspace!.usage_type,
        company_name: draftWorkspace!.company_name,
        industry: draftWorkspace!.industry,
        social_platforms: draftWorkspace!.social_platforms,
        content_goals: draftWorkspace!.content_goals,
        onboarding_step: nextStep,
      }),
      updateBranding({
        color_primary: draftBranding!.color_primary,
        color_secondary: draftBranding!.color_secondary,
        color_accent: draftBranding!.color_accent,
      }),
    ]);
    setIsSaving(false);

    const failure = results.find((result) => result.error);
    if (failure?.error) {
      setErrorMessage(failure.error);
      return false;
    }
    return true;
  }

  async function handleNext() {
    if (step >= TOTAL_STEPS) return;
    const ok = await persistCurrentStep(step + 1);
    if (ok) setStep((prev) => prev + 1);
  }

  function handleBack() {
    if (step <= 1) return;
    setStep((prev) => prev - 1);
  }

  async function handleFinishLater() {
    await persistCurrentStep(step);
    router.push("/");
  }

  async function handleComplete() {
    const ok = await persistCurrentStep(step);
    if (!ok) return;
    setIsSaving(true);
    const { error } = await updateWorkspace({ onboarding_completed: true, onboarding_step: TOTAL_STEPS });
    setIsSaving(false);
    if (error) {
      setErrorMessage(error);
      return;
    }
    await refresh();
    router.push("/");
  }

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="accent-halo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLogoMark className="h-5 w-5 text-white" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{welcomeTitle}</span>
            <span className="text-xs text-muted-foreground">
              {t("onboarding.stepOf", { step, total: TOTAL_STEPS, title: t(STEP_TITLE_KEYS[step - 1]) })}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{welcomeSubtitle}</p>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="mb-5 text-lg font-semibold text-foreground">{t(STEP_TITLE_KEYS[step - 1])}</h1>

          {step === 1 && (
            <PersonalInfoStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 2 && (
            <WorkspaceNameStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 3 && (
            <UsageTypeStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 4 && (
            <CompanyStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 5 && (
            <IndustryStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 6 && (
            <PlatformsStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 7 && (
            <GoalsStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}
          {step === 8 && <BrandingStep branding={draftBranding} onBrandingChange={handleBrandingChange} />}
          {step === 9 && (
            <ConfirmationStep
              profile={draftProfile}
              workspace={draftWorkspace}
              onProfileChange={handleProfileChange}
              onWorkspaceChange={handleWorkspaceChange}
            />
          )}

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSaving}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  {t("onboarding.back")}
                </button>
              )}
              <button
                type="button"
                onClick={handleFinishLater}
                disabled={isSaving}
                className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
              >
                {t("onboarding.finishLater")}
              </button>
            </div>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? t("onboarding.saving") : t("onboarding.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSaving}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? t("onboarding.finishing") : t("onboarding.finish")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
