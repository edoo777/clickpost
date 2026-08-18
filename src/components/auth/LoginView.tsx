"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { PasswordField } from "@/components/auth/PasswordField";
import { translateAuthError } from "@/lib/auth-errors";
import { validateEmail } from "@/lib/auth-validation";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const hasCallbackError = searchParams.get("erreur") === "lien_invalide";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<TranslationKey | null>(null);
  const [passwordError, setPasswordError] = useState<TranslationKey | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<TranslationKey | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? null : "auth.validation.passwordRequired";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setStatus("error");
      setErrorMessage(translateAuthError(error.message));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <span>
          {t("auth.login.noAccount")}{" "}
          <Link href="/inscription" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
            {t("auth.login.createAccount")}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {hasCallbackError && <AuthMessage kind="error">{t("auth.login.invalidLink")}</AuthMessage>}

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
        <div className="flex flex-col gap-1.5">
          <PasswordField
            label={t("auth.passwordLabel")}
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            error={passwordError ? t(passwordError) : null}
          />
          <Link
            href="/mot-de-passe-oublie"
            className="self-end text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        {errorMessage && <AuthMessage kind="error">{t(errorMessage)}</AuthMessage>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
