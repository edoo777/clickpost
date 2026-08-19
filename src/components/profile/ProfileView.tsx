"use client";

import Link from "next/link";
import { useState } from "react";
import { platformIcons } from "@/components/icons";
import { ThemeSelect } from "@/components/theme/ThemeSelect";
import { useAccountsSession } from "@/lib/accounts-store";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS, NOTIFICATION_LABEL, TIME_ZONE_OPTIONS } from "@/lib/settings-data";
import { ROLE_LABEL, ROLE_STYLE } from "@/lib/team-data";
import { useTeamSession } from "@/lib/team-store";
import { useUserProfileSession } from "@/lib/user-profile-store";
import type { NotificationKey } from "@/types/settings";
import type { UserProfileExtra } from "@/types/user-profile";

const NOTIFICATION_ORDER: NotificationKey[] = [
  "new_to_review",
  "change_requests",
  "approvals_received",
  "expired_connections",
  "publish_failures",
  "weekly_summary",
];

const FIELD_CLASS =
  "rounded-xl border border-border bg-surface px-3 py-2 text-sm text-zinc-800 shadow-sm transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60   dark:text-zinc-200 dark:focus:ring-violet-500/20";

const SECTION_CLASS =
  "rounded-2xl border border-border bg-surface p-5 shadow-sm  ";

export function ProfileView() {
  const t = useTranslations();
  const { members, currentUserId } = useTeamSession();
  const { getProfile, updateProfile } = useUserProfileSession();
  const { accounts } = useAccountsSession();
  const { brands } = useBrandsSession();

  const member = members.find((candidate) => candidate.id === currentUserId);
  const profile = getProfile(currentUserId, member?.name ?? "");

  const [draft, setDraft] = useState<UserProfileExtra>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const displayed = isEditing ? draft : profile;

  if (!member) {
    return <p className="text-sm text-muted-foreground ">{t("profile.view.userNotFound")}</p>;
  }

  function set<K extends keyof UserProfileExtra>(key: K, value: UserProfileExtra[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleEdit() {
    setDraft(profile);
    setIsEditing(true);
  }

  function handleCancel() {
    setDraft(profile);
    setIsEditing(false);
  }

  function handleSave() {
    updateProfile(currentUserId, draft);
    setIsEditing(false);
  }

  const managedBrands = brands.filter((brand) => member.brands.includes(brand.name));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="accent-halo flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xl font-semibold text-white">
            {member.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground ">{member.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLE[member.role]}`}>
                {ROLE_LABEL[member.role]}
              </span>
              <span className="text-sm text-muted-foreground ">{member.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("profile.view.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
              >
                {t("profile.view.save")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {t("profile.view.editProfile")}
            </button>
          )}
        </div>
      </header>

      {isEditing && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          {t("profile.view.sessionOnlyNotice")}
        </p>
      )}

      <section className={SECTION_CLASS}>
        <h2 className="mb-4 text-sm font-semibold text-foreground ">{t("profile.view.identityTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.firstName")}
            <input
              disabled={!isEditing}
              value={displayed.firstName}
              onChange={(event) => set("firstName", event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.lastName")}
            <input
              disabled={!isEditing}
              value={displayed.lastName}
              onChange={(event) => set("lastName", event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.email")}
            <input disabled value={member.email} className={FIELD_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.role")}
            <input disabled value={ROLE_LABEL[member.role]} className={FIELD_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.company")}
            <input
              disabled={!isEditing}
              value={displayed.company}
              onChange={(event) => set("company", event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.phone")}
            <input
              disabled={!isEditing}
              value={displayed.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="+33 6 00 00 00 00"
              className={FIELD_CLASS}
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("profile.view.bio")}
          <textarea
            disabled={!isEditing}
            rows={3}
            value={displayed.bio}
            onChange={(event) => set("bio", event.target.value)}
            placeholder={t("profile.view.bioPlaceholder")}
            className={FIELD_CLASS}
          />
        </label>
        <p className="mt-3 text-xs text-muted-foreground ">
          {t("profile.view.manageFromTeamPrefix")}{" "}
          <Link href="/equipe" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
            {t("profile.view.teamLink")}
          </Link>
          .
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-4 text-sm font-semibold text-foreground ">{t("profile.view.localizationTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.timeZone")}
            <select
              disabled={!isEditing}
              value={displayed.timeZone}
              onChange={(event) => set("timeZone", event.target.value)}
              className={FIELD_CLASS}
            >
              {TIME_ZONE_OPTIONS.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.language")}
            <select
              disabled={!isEditing}
              value={displayed.language}
              onChange={(event) => set("language", event.target.value)}
              className={FIELD_CLASS}
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.country")}
            <select
              disabled={!isEditing}
              value={displayed.country}
              onChange={(event) => set("country", event.target.value)}
              className={FIELD_CLASS}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-4 text-sm font-semibold text-foreground ">{t("profile.view.connectedAccountsTitle")}</h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground ">{t("profile.view.noConnectedAccounts")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {accounts.map((account) => {
              const Icon = platformIcons[account.platform];
              return (
                <li
                  key={account.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600  dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {account.handle}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground ">
          {t("profile.view.manageFromAccountsPrefix")}{" "}
          <Link href="/comptes" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
            {t("profile.view.accountsLink")}
          </Link>
          .
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-4 text-sm font-semibold text-foreground ">{t("profile.view.managedBrandsTitle")}</h2>
        {managedBrands.length === 0 ? (
          <p className="text-sm text-muted-foreground ">{t("profile.view.noManagedBrands")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {managedBrands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
              >
                {brand.name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground ">
          {t("profile.view.editableFromTeamPrefix")}{" "}
          <Link href="/equipe" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
            {t("profile.view.teamLink")}
          </Link>
          .
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-1 text-sm font-semibold text-foreground ">{t("profile.view.notificationsTitle")}</h2>
        <p className="mb-4 text-xs text-muted-foreground ">
          {t("profile.view.notificationsSimulationNotice")}
        </p>
        <div className="flex flex-col divide-y divide-border ">
          {NOTIFICATION_ORDER.map((key) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-zinc-700 first:pt-0 last:pb-0 dark:text-zinc-300"
            >
              {NOTIFICATION_LABEL[key]}
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => set("notifications", { ...displayed.notifications, [key]: !displayed.notifications[key] })}
                aria-label={displayed.notifications[key] ? t("profile.view.disable") : t("profile.view.enable")}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  displayed.notifications[key] ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" : "bg-zinc-300 dark:bg-zinc-700"
                } ${isEditing ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    displayed.notifications[key] ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-1 text-sm font-semibold text-foreground ">{t("profile.view.displayPreferencesTitle")}</h2>
        <p className="mb-4 text-xs text-muted-foreground ">
          {t("profile.view.themeAppliesImmediately")}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.theme")}
            <ThemeSelect surface="light" />
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.view.displayDensity")}
            <select
              disabled={!isEditing}
              value={displayed.displayDensity}
              onChange={(event) => set("displayDensity", event.target.value as UserProfileExtra["displayDensity"])}
              className={FIELD_CLASS}
            >
              <option value="comfortable">{t("profile.view.densityComfortable")}</option>
              <option value="compact">{t("profile.view.densityCompact")}</option>
            </select>
          </label>
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-4 text-sm font-semibold text-foreground ">{t("profile.view.securityTitle")}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground  "
          >
            {t("profile.view.changePassword")}
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground  "
          >
            {t("profile.view.manageSessions")}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground ">
          {t("profile.view.advancedAuthNotAvailable")}
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-4 text-sm font-semibold text-foreground ">{t("profile.view.subscriptionTitle")}</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t("profile.view.subscriptionPlan")}</span>
            <span className="text-xs text-muted-foreground ">
              {t("profile.view.noPaymentSystem")}
            </span>
          </div>
          <span className="w-fit rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20">
            {t("profile.view.subscriptionActive")}
          </span>
        </div>
      </section>
    </div>
  );
}
