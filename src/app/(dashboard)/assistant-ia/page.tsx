"use client";

import { useState } from "react";
import { AssistantCopilotView } from "@/components/assistant-ia/AssistantCopilotView";
import { AssistantPreparationView } from "@/components/assistant-ia/AssistantPreparationView";

const TABS = [
  { id: "copilot", label: "Copilote éditorial" },
  { id: "preparation", label: "Assistant de préparation" },
];

export default function AssistantIAPage() {
  const [activeTab, setActiveTab] = useState("copilot");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assistant IA</h1>
          <p className="text-sm text-muted-foreground">
            Un Copilote éditorial connecté à votre marque et à votre contenu. Passez d’un parcours de préparation
            à une expérience conversationnelle selon vos besoins.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "copilot" ? <AssistantCopilotView /> : <AssistantPreparationView />}
    </div>
  );
}
