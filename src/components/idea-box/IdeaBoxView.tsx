"use client";

import { useState } from "react";
import { IconLightbulb } from "@/components/icons";
import { IdeasBankListView } from "@/components/ideas-bank/IdeasBankListView";
import { TopicGeneratorView } from "@/components/topic-generator/TopicGeneratorView";

type IdeaBoxTab = "generateur" | "banque";

const TABS: { key: IdeaBoxTab; label: string; description: string }[] = [
  { key: "generateur", label: "Générateur d'idées", description: "Produire des sujets à partir d'une thématique" },
  { key: "banque", label: "Banque d'idées", description: "Filtrer, éditer et transformer les idées existantes" },
];

export function IdeaBoxView() {
  const [tab, setTab] = useState<IdeaBoxTab>("generateur");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="accent-halo flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLightbulb className="h-5 w-5 text-white" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
            Boîte à idées
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ">
          Générez des sujets, consultez la banque, puis filtrez, éditez et transformez vos idées vers
          l&apos;Atelier ou une publication.
        </p>
      </header>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-1.5   sm:flex-row">
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
            <span className="text-sm font-semibold">{item.label}</span>
            <span className={`text-xs ${tab === item.key ? "text-white/80" : "text-muted-foreground "}`}>
              {item.description}
            </span>
          </button>
        ))}
      </div>

      {tab === "generateur" ? <TopicGeneratorView /> : <IdeasBankListView />}
    </div>
  );
}
