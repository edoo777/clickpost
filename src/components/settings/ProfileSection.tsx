"use client";

import { useRef, useState } from "react";
import { uploadAvatar } from "@/lib/supabase/storage";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:text-zinc-200";
const LABEL_CLASS = "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

/**
 * Paramètres → Profil : édite les données personnelles réelles (Supabase Auth + table
 * profiles), distinct des paramètres d'agence locaux gérés par le reste de cette page.
 * L'identifiant et le courriel proviennent de Supabase Auth et ne sont jamais modifiables ici.
 */
export function ProfileSection() {
  const { userId, email, profile, updateProfile } = useWorkspaceSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "");
  const [language, setLanguage] = useState(profile?.language ?? "");
  const [timeZone, setTimeZone] = useState(profile?.time_zone ?? "");
  const [initializedFromId, setInitializedFromId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  if (profile && initializedFromId !== profile.id) {
    setInitializedFromId(profile.id);
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setDisplayName(profile.display_name ?? "");
    setJobTitle(profile.job_title ?? "");
    setLanguage(profile.language);
    setTimeZone(profile.time_zone);
  }

  if (!profile || !userId) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Profil</h2>
        <p className="text-sm text-muted-foreground">Chargement du profil…</p>
      </section>
    );
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);
    const { error } = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: displayName.trim() || null,
      job_title: jobTitle.trim() || null,
      language: language.trim(),
      time_zone: timeZone.trim(),
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error);
      return;
    }
    setStatus("saved");
  }

  async function handleAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;
    setIsUploadingAvatar(true);
    setErrorMessage(null);
    const { url, error } = await uploadAvatar(userId, file);
    setIsUploadingAvatar(false);
    if (error || !url) {
      setErrorMessage(error ?? "Le téléversement de l'avatar a échoué.");
      return;
    }
    await updateProfile({ avatar_url: url });
  }

  const initial = (displayName || firstName || email || "?").slice(0, 1).toUpperCase();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Profil</h2>
        <p className="text-xs text-muted-foreground">Vos informations personnelles — visibles par les membres de votre espace de travail.</p>
      </div>

      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar externe (Supabase Storage), pas d'optimisation next/image nécessaire ici.
          <img src={profile.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-semibold text-white">
            {initial}
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-60 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {isUploadingAvatar ? "Envoi…" : "Changer l'avatar"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarSelected} className="hidden" />
          <span className="text-[11px] text-muted-foreground">PNG, JPEG, WEBP ou GIF — 5 Mo maximum.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          Prénom
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={FIELD_CLASS} />
        </label>
        <label className={LABEL_CLASS}>
          Nom
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} className={FIELD_CLASS} />
        </label>
      </div>

      <label className={LABEL_CLASS}>
        Nom complet affiché
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={`${firstName} ${lastName}`.trim() || "Nom affiché"}
          className={FIELD_CLASS}
        />
      </label>

      <label className={LABEL_CLASS}>
        Fonction ou poste (facultatif)
        <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className={FIELD_CLASS} />
      </label>

      <label className={LABEL_CLASS}>
        Adresse courriel
        <input value={email} disabled className={`${FIELD_CLASS} cursor-not-allowed opacity-70`} />
        <span className="text-[11px] font-normal text-muted-foreground">Gérée par votre compte de connexion — non modifiable ici.</span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          Langue préférée
          <input value={language} onChange={(event) => setLanguage(event.target.value)} className={FIELD_CLASS} />
        </label>
        <label className={LABEL_CLASS}>
          Fuseau horaire
          <input value={timeZone} onChange={(event) => setTimeZone(event.target.value)} className={FIELD_CLASS} />
        </label>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      {status === "saved" && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Profil enregistré.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={status === "saving"}
        className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "saving" ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </section>
  );
}
