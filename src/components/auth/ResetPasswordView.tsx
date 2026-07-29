"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { translateAuthError } from "@/lib/auth-errors";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth-validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionState = "checking" | "valid" | "invalid";

export function ResetPasswordView() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session ? "valid" : "invalid");
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const nextPasswordError = validatePassword(password);
    const nextConfirmError = validatePasswordsMatch(password, confirmPassword);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) return;

    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMessage(translateAuthError(error.message));
      return;
    }

    await supabase.auth.signOut();
    setStatus("success");
    router.push("/connexion");
    router.refresh();
  }

  if (sessionState === "checking") {
    return (
      <AuthShell title="Réinitialiser le mot de passe">
        <p className="text-center text-sm text-muted-foreground">Vérification du lien…</p>
      </AuthShell>
    );
  }

  if (sessionState === "invalid") {
    return (
      <AuthShell title="Lien invalide">
        <div className="flex flex-col gap-4">
          <AuthMessage kind="error">
            Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.
          </AuthMessage>
          <Link
            href="/mot-de-passe-oublie"
            className="text-center text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Redemander un lien
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Réinitialiser le mot de passe" subtitle="Choisissez un nouveau mot de passe.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordField
          label="Nouveau mot de passe"
          id="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={passwordError}
        />
        <PasswordField
          label="Confirmer le nouveau mot de passe"
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={confirmError}
        />

        {errorMessage && <AuthMessage kind="error">{errorMessage}</AuthMessage>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </AuthShell>
  );
}
