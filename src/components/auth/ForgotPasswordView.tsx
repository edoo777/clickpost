"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { validateEmail } from "@/lib/auth-validation";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordView() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<TranslationKey | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    if (nextEmailError) return;

    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    // Le résultat n'est jamais différencié côté UI (avec ou sans erreur) pour ne pas révéler
    // si l'adresse est enregistrée — seule une erreur réseau franche resterait invisible ici,
    // ce qui est un compromis assumé au profit de la confidentialité des comptes.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser-mot-de-passe`,
    });
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <AuthShell title={t("auth.forgotPassword.title")}>
        <div className="flex flex-col gap-4">
          <AuthMessage kind="success">{t("auth.forgotPassword.confirmation")}</AuthMessage>
          <Link href="/connexion" className="text-center text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.forgotPassword.title")}
      subtitle={t("auth.forgotPassword.subtitle")}
      footer={
        <Link href="/connexion" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          label={t("auth.emailLabel")}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError ? t(emailError) : null}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
