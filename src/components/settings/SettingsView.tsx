"use client";

import { useState } from "react";
import { AgencyInfoSection } from "@/components/settings/AgencyInfoSection";
import { BrandIdentitySection } from "@/components/settings/BrandIdentitySection";
import { ContentPreferencesSection } from "@/components/settings/ContentPreferencesSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { OtherSectionsLinks } from "@/components/settings/OtherSectionsLinks";
import { WorkflowSection } from "@/components/settings/WorkflowSection";
import { WorkspaceSection } from "@/components/settings/WorkspaceSection";
import { useAccountsSession } from "@/lib/accounts-store";
import { brandProfiles } from "@/lib/brand-profiles";
import { DEFAULT_AGENCY_SETTINGS } from "@/lib/settings-data";
import { useSettingsSession } from "@/lib/settings-store";
import { useTeamSession } from "@/lib/team-store";
import type { AgencySettings } from "@/types/settings";

export function SettingsView() {
  const { settings, setSettings } = useSettingsSession();
  const { members, currentUserId } = useTeamSession();
  const { accounts } = useAccountsSession();

  const currentMember = members.find((member) => member.id === currentUserId);
  const canEdit = currentMember?.role === "owner" || currentMember?.role === "admin";

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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Paramètres</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Paramètres généraux utilisés dans toute la plateforme.
          </p>
        </header>

        {canEdit && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
                >
                  Enregistrer
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Modifier
              </button>
            )}
          </div>
        )}
      </div>

      {!canEdit && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Réservé aux rôles Propriétaire et Administrateur — lecture seule pour votre rôle actuel.
        </p>
      )}

      {isEditing && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Les modifications restent en mémoire pour cette session uniquement — elles seront perdues
          au rechargement de la page.
        </p>
      )}

      <OtherSectionsLinks />

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
        brandsCount={brandProfiles.length}
        membersCount={members.length}
        accountsCount={accounts.length}
      />
    </div>
  );
}
