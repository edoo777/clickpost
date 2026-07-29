"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { PasswordField } from "@/components/auth/PasswordField";
import { translateAuthError } from "@/lib/auth-errors";
import { validatePassword, validatePasswordsMatch, validateEmail, validateRequired } from "@/lib/auth-validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignUpView() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const nextErrors: FieldErrors = {
      firstName: validateRequired(firstName, "Le prénom") ?? undefined,
      lastName: validateRequired(lastName, "Le nom") ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: validatePasswordsMatch(password, confirmPassword) ?? undefined,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(translateAuthError(error.message));
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <AuthShell title="Vérifiez votre boîte de réception" subtitle="Un courriel de confirmation vient d'être envoyé.">
        <div className="flex flex-col gap-4">
          <AuthMessage kind="success">
            Cliquez sur le lien reçu à <strong>{email}</strong> pour confirmer votre adresse et activer votre compte.
          </AuthMessage>
          <Link href="/connexion" className="text-center text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Créer un compte" subtitle="Rejoignez ClickPost pour gérer vos contenus." footer={
      <span>
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
          Se connecter
        </Link>
      </span>
    }>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Prénom"
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={errors.firstName}
          />
          <FormField
            label="Nom"
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={errors.lastName}
          />
        </div>
        <FormField
          label="Adresse courriel"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Mot de passe"
          id="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />

        {errorMessage && <AuthMessage kind="error">{errorMessage}</AuthMessage>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>
    </AuthShell>
  );
}
