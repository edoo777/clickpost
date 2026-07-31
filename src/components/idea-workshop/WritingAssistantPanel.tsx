"use client";

import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { IconHistory, IconPanelRight, IconSettingsGear, IconSparkles } from "@/components/icons";
import { PROMPT_CATEGORY_LABEL, getPresetsByCategory, type PromptCategory, type PromptPreset } from "@/lib/prompt-presets";

type PanelTab = "assistant" | "properties" | "versions";

interface WritingAssistantPanelProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onRunPreset: (preset: PromptPreset) => void;
  propertiesSlot: ReactNode;
  versionsSlot: ReactNode;
  resultSlot?: ReactNode;
  initialTab?: PanelTab;
  /** Une génération est en cours (locale ou réelle) — désactive les actions pour éviter les
   * déclenchements multiples, notamment des appels Claude superflus. */
  isRunningPreset?: boolean;
}

const CATEGORIES: PromptCategory[] = ["start", "improve", "finish", "adapt", "tone"];

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

/**
 * Panneau latéral droit réductible : Assistant IA (commandes catégorisées), Propriétés et
 * Versions. Garde la feuille de rédaction centrale dégagée de ces informations secondaires.
 */
export function WritingAssistantPanel({
  isCollapsed,
  onToggleCollapsed,
  onRunPreset,
  propertiesSlot,
  versionsSlot,
  resultSlot,
  initialTab = "assistant",
  isRunningPreset = false,
}: WritingAssistantPanelProps) {
  const [tab, setTab] = useState<PanelTab>(initialTab);
  const [openCategory, setOpenCategory] = useState<PromptCategory | null>("start");

  if (isCollapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center gap-2 border-l border-border bg-surface py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Déployer le panneau latéral"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <IconPanelRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full shrink-0 flex-col border-border bg-surface lg:w-80 lg:border-l">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          <TabButton active={tab === "assistant"} onClick={() => setTab("assistant")} icon={IconSparkles} label="Assistant IA" />
          <TabButton active={tab === "properties"} onClick={() => setTab("properties")} icon={IconSettingsGear} label="Propriétés" />
          <TabButton active={tab === "versions"} onClick={() => setTab("versions")} icon={IconHistory} label="Versions" />
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Réduire le panneau latéral"
          className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:block"
        >
          <IconPanelRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "assistant" && (
          <div className="flex flex-col gap-1">
            <p className="mb-2 rounded-lg bg-muted px-2.5 py-2 text-xs text-muted-foreground">
              « Génération complète » peut utiliser Claude (IA réelle) si configuré côté serveur ;
              les autres actions restent générées localement (mode démonstration).
            </p>
            {resultSlot}
            {CATEGORIES.map((category) => {
              const presets = getPresetsByCategory(category);
              const isOpen = openCategory === category;
              return (
                <div key={category} className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? null : category)}
                    aria-expanded={isOpen}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
                  >
                    {PROMPT_CATEGORY_LABEL[category]}
                    <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-0.5 pb-2 pl-1">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          title={preset.description}
                          onClick={() => onRunPreset(preset)}
                          disabled={isRunningPreset}
                          aria-busy={isRunningPreset}
                          className="group rounded-lg px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:hover:bg-violet-500/10"
                        >
                          <span className="group-hover:text-violet-700 dark:group-hover:text-violet-300">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {tab === "properties" && propertiesSlot}
        {tab === "versions" && versionsSlot}
      </div>
    </div>
  );
}
