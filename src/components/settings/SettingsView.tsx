"use client";

import { useState } from "react";
import { AgencyInfoSection } from "@/components/settings/AgencyInfoSection";
import { BrandIdentitySection } from "@/components/settings/BrandIdentitySection";
import { BrandingSection } from "@/components/settings/BrandingSection";
import { ContentPreferencesSection } from "@/components/settings/ContentPreferencesSection";
import { DataPrivacySection } from "@/components/settings/DataPrivacySection";
import { DisplayPreferencesSection } from "@/components/settings/DisplayPreferencesSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { OtherSectionsLinks } from "@/components/settings/OtherSectionsLinks";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SubscriptionSection } from "@/components/settings/SubscriptionSection";
import { WorkflowSection } from "@/components/settings/WorkflowSection";
import { WorkspaceSection } from "@/components/settings/WorkspaceSection";
import { WorkspaceErrorNotice } from "@/components/shared/WorkspaceErrorNotice";
import { useAccountsSession } from "@/lib/accounts-store";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { DEFAULT_AGENCY_SETTINGS } from "@/lib/settings-data";
import { useSettingsSession } from "@/lib/settings-store";
import { useTeamSession } from "@/lib/team-store";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { AgencySettings } from "@/types/settings";

export function SettingsView() {
  const t = useTranslations();
  const { settings, setSettings } = useSettingsSession();
  const { members } = useTeamSession();
  const { accounts } = useAccountsSession();
  const { brands } = useBrandsSession();
  const { isAdmin, isLoading: isWorkspaceLoading, workspaceError, refresh } = useWorkspaceSession();

  // Source réelle des permissions (Supabase workspace_members), jamais le sélecteur local
  // « Connecté en tant que » — voir la correction du problème d'autorisation des marques.
  const canEdit = !isWorkspaceLoading && !workspaceError && isAdmin;

  const [draft, setDraft] = useState<AgencySettings>(settings);
  const [isEditing, setIsEditing] = useState(false);

  const displayed = isEditing ? draft : settings;

  function handleEditClick() {
    setDraft(settings);
    setIsEditing(true);
  }

  function handleSave() {
    setSettings(draft);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(settings);
    setIsEditing(false);
  }

  function handleResetIdentity() {
    setDraft((prev) => ({ ...prev, identity: DEFAULT_AGENCY_SETTINGS.identity }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">{t("pageTitle.settings")}</h1>
          <p className="text-sm text-muted-foreground ">
            {t("pageHeader.settingsSubtitle")}
          </p>
        </header>

        {canEdit && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  {t("settings.view.cancelButton")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
                >
                  {t("settings.view.saveButton")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("settings.view.editButton")}
              </button>
            )}
          </div>
        )}
      </div>

      {isWorkspaceLoading && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {t("settings.view.loadingWorkspace")}
        </p>
      )}

      {workspaceError && <WorkspaceErrorNotice error={workspaceError} onRetry={() => void refresh()} />}

      {!isWorkspaceLoading && !workspaceError && !canEdit && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {t("settings.view.readOnlyNotice")}
        </p>
      )}

      {isEditing && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {t("settings.view.editingNotice")}
        </p>
      )}

      <OtherSectionsLinks />

      <ProfileSection />

      <BrandingSection />

      <DisplayPreferencesSection />

      <DataPrivacySection />

      <AgencyInfoSection
        info={displayed.info}
        editable={isEditing}
        onChange={(info) => setDraft({ ...draft, info })}
      />
      <BrandIdentitySection
        identity={displayed.identity}
        editable={isEditing}
        onChange={(identity) => setDraft({ ...draft, identity })}
        onReset={handleResetIdentity}
      />
      <ContentPreferencesSection
        content={displayed.content}
        editable={isEditing}
        onChange={(content) => setDraft({ ...draft, content })}
      />
      <WorkflowSection
        workflow={displayed.workflow}
        members={members}
        editable={isEditing}
        onChange={(workflow) => setDraft({ ...draft, workflow })}
      />
      <NotificationsSection
        notifications={displayed.notifications}
        editable={isEditing}
        onChange={(notifications) => setDraft({ ...draft, notifications })}
      />
      <WorkspaceSection
        brandsCount={brands.length}
        membersCount={members.length}
        accountsCount={accounts.length}
      />
      <SubscriptionSection editable={canEdit} />
    </div>
  );
}
