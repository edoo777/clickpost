"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function ConditionsView() {
  const t = useTranslations();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-6 py-16 text-foreground">
      <Link href="/bienvenue" className="w-fit text-sm text-muted-foreground hover:underline">
        {t("legal.back")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{t("legal.terms.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("legal.terms.paragraph1")}</p>
      <p className="text-sm text-muted-foreground">{t("legal.terms.paragraph2")}</p>
    </div>
  );
}
