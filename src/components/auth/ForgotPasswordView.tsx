"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { validateEmail } from "@/lib/auth-validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const GENERIC_CONFIRMATION =
  "Si un compte existe avec cette adresse, un courriel contenant un lien de réinitialisation vient d'être envoyé.";

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
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
      <AuthShell title="Vérifiez votre boîte de réception">
        <div className="flex flex-col gap-4">
          <AuthMessage kind="success">{GENERIC_CONFIRMATION}</AuthMessage>
          <Link href="/connexion" className="text-center text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Entrez votre adresse courriel pour recevoir un lien de réinitialisation."
      footer={
        <Link href="/connexion" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          label="Adresse courriel"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Envoi…" : "Envoyer le lien de réinitialisation"}
        </button>
      </form>
    </AuthShell>
  );
}
