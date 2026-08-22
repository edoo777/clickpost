"use client";

import { useState } from "react";
import { HumanPlaceholder } from "@/components/marketing/HumanPlaceholder";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { useTranslations } from "@/lib/i18n/locale-provider";

const INPUT_CLASS = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground";
const PERSONAS = ["creator", "entrepreneur", "agency", "marketingTeam", "other"] as const;

type SubmitState = "idle" | "sending" | "success" | "error";

/** Formulaire de contact réel — envoie vers `/api/marketing/contact`, qui écrit chaque message
 * dans `contact_submissions` (voir la migration associée). Jamais un succès affiché sans écriture
 * réelle confirmée par le serveur. */
export function ContactView() {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [persona, setPersona] = useState<(typeof PERSONAS)[number]>("creator");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, persona, message }),
      });
      if (!response.ok) {
        setState("error");
        return;
      }
      setState("success");
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
    } catch {
      setState("error");
    }
  }

  return (
    <MarketingShell>
      <section className="border-b border-border bg-gradient-to-b from-violet-50/60 to-transparent px-6 py-20 dark:from-violet-500/[.06] sm:py-24">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <SectionEyebrow>{t("contact.eyebrow")}</SectionEyebrow>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("contact.title")}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("contact.subtitle")}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground/90">
                {t("contact.form.name")}
                <input required value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground/90">
                {t("contact.form.email")}
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT_CLASS} />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground/90">
              {t("contact.form.company")}
              <input value={company} onChange={(event) => setCompany(event.target.value)} className={INPUT_CLASS} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground/90">
              {t("contact.form.iAm")}
              <select value={persona} onChange={(event) => setPersona(event.target.value as (typeof PERSONAS)[number])} className={INPUT_CLASS}>
                {PERSONAS.map((option) => (
                  <option key={option} value={option}>
                    {t(`contact.form.iAmOptions.${option}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground/90">
              {t("contact.form.message")}
              <textarea required rows={5} value={message} onChange={(event) => setMessage(event.target.value)} className={INPUT_CLASS} />
            </label>

            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "sending" ? t("contact.form.sending") : t("contact.form.submit")}
            </button>

            {state === "success" && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("contact.form.success")}</p>}
            {state === "error" && <p className="text-sm font-medium text-red-600 dark:text-red-400">{t("contact.form.error")}</p>}
          </form>

          <div className="flex flex-col gap-5">
            <HumanPlaceholder
              persona="socialMediaManager"
              alt={t("contact.title")}
              label="ClickPost"
              suggestedPath="/marketing/social-media-manager.webp"
              aspectClassName="aspect-[16/10]"
            />
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">{t("contact.sidebar.supportTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("contact.sidebar.supportText")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">{t("contact.sidebar.partnershipTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("contact.sidebar.partnershipText")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">{t("contact.sidebar.businessTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("contact.sidebar.businessText")}</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
