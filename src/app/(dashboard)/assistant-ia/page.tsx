"use client";

import { useState } from "react";
import { AssistantCopilotView } from "@/components/assistant-ia/AssistantCopilotView";
import { AssistantPreparationView } from "@/components/assistant-ia/AssistantPreparationView";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";

const TAB_KEYS: { id: string; labelKey: TranslationKey }[] = [
  { id: "copilot", labelKey: "assistant.page.tabCopilot" },
  { id: "preparation", labelKey: "assistant.page.tabPreparation" },
];

export default function AssistantIAPage() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("copilot");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("assistant.page.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("assistant.page.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-500/10"
                  : "rounded-2xl border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              }
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "copilot" ? <AssistantCopilotView /> : <AssistantPreparationView />}
    </div>
  );
}
