"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconLightbulb } from "@/components/icons";
import { IdeasBankListView } from "@/components/ideas-bank/IdeasBankListView";
import { TopicGeneratorView } from "@/components/topic-generator/TopicGeneratorView";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";

type IdeaBoxTab = "generateur" | "banque";

const TABS: { key: IdeaBoxTab; labelKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { key: "generateur", labelKey: "pageTitle.topicGenerator", descriptionKey: "ideaBox.generatorTabDescription" },
  { key: "banque", labelKey: "pageTitle.ideasBankPage", descriptionKey: "ideaBox.bankTabDescription" },
];

function tabFromParam(value: string | null): IdeaBoxTab {
  return value === "banque" ? "banque" : "generateur";
}

export function IdeaBoxView() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<IdeaBoxTab>(() => tabFromParam(tabParam));

  // Garde l'onglet synchronisé avec ?tab=, notamment pour le popover de la sidebar réduite
  // (Générateur d'idées / Banque d'idées), qui navigue vers cette même page avec un paramètre différent.
  // Ajustement pendant le rendu (motif recommandé par React), pas dans un effet.
  const [lastSyncedParam, setLastSyncedParam] = useState(tabParam);
  if (tabParam !== lastSyncedParam) {
    setLastSyncedParam(tabParam);
    setTab(tabFromParam(tabParam));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="accent-halo flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLightbulb className="h-5 w-5 text-white" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("pageTitle.ideasBank")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("ideaBox.subtitle")}</p>
      </header>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-1.5 sm:flex-row">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex flex-1 flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left transition-all ${
              tab === item.key
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
                : "text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-100"
            }`}
          >
            <span className="text-sm font-semibold">{t(item.labelKey)}</span>
            <span className={`text-xs ${tab === item.key ? "text-white/80" : "text-muted-foreground"}`}>
              {t(item.descriptionKey)}
            </span>
          </button>
        ))}
      </div>

      {tab === "generateur" ? <TopicGeneratorView /> : <IdeasBankListView />}
    </div>
  );
}
