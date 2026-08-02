"use client";

import { useEffect, useRef, useState } from "react";
import { IconWand } from "@/components/icons";
import { useBrandsSession } from "@/lib/brands-store";
import { QUICK_ACTIONS, QUICK_ACTION_TARGET_LABEL, type QuickActionDefinition } from "@/lib/ai/quick-actions";
import { runQuickAction } from "@/lib/banque-quick-action";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { Idea } from "@/types/idea";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];

const ITEM_CLASS =
  "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300";

type MenuState =
  | { phase: "closed" }
  | { phase: "open" }
  | { phase: "collecting_platform"; action: QuickActionDefinition }
  | { phase: "loading"; action: QuickActionDefinition }
  | { phase: "preview"; action: QuickActionDefinition; items: string[]; selectedIndex: number }
  | { phase: "error"; action: QuickActionDefinition; message: string };

function fieldValue(idea: Idea, field: QuickActionDefinition["targetField"]): string {
  switch (field) {
    case "title":
      return idea.title;
    case "description":
      return idea.description ?? "";
    case "hook":
      return idea.hook ?? "";
    case "contentPlan":
      return idea.contentPlan ?? "";
    case "cta":
      return idea.cta ?? "";
    case "angle":
      return idea.angle ?? "";
    default:
      return "";
  }
}

interface QuickActionsMenuProps {
  idea: Idea;
  compact?: boolean;
}

/**
 * Menu « Améliorer avec l'IA » — actions ciblées et facultatives sur une idée de la Banque,
 * jamais un assistant conversationnel permanent. Chaque action : un clic explicite, un aperçu
 * avant application, jamais d'écrasement silencieux (voir runQuickAction / la route associée).
 */
export function QuickActionsMenu({ idea, compact }: QuickActionsMenuProps) {
  const { brands } = useBrandsSession();
  const { updateIdea } = useContentWorkspace();
  const [state, setState] = useState<MenuState>({ phase: "closed" });
  const [platformDraft, setPlatformDraft] = useState<SocialPlatform>("instagram");
  const containerRef = useRef<HTMLDivElement>(null);
  const brand = brands.find((candidate) => candidate.id === idea.brandId);

  useEffect(() => {
    if (state.phase === "closed") return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setState({ phase: "closed" });
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setState({ phase: "closed" });
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.phase]);

  function stop(event: React.MouseEvent) {
    event.stopPropagation();
  }

  async function execute(action: QuickActionDefinition, targetPlatform?: SocialPlatform) {
    setState({ phase: "loading", action });
    const outcome = await runQuickAction({
      action: action.key,
      title: idea.title,
      description: idea.description,
      brandTone: action.requiresBrandTone ? brand?.toneOfVoice : undefined,
      targetPlatform,
    });
    if (outcome.status !== "ok") {
      setState({ phase: "error", action, message: outcome.message });
      return;
    }
    setState({ phase: "preview", action, items: outcome.items, selectedIndex: 0 });
  }

  function handlePickAction(event: React.MouseEvent, action: QuickActionDefinition) {
    stop(event);
    if (action.requiresPlatform) {
      setState({ phase: "collecting_platform", action });
      return;
    }
    void execute(action);
  }

  function handleApply(event: React.MouseEvent) {
    stop(event);
    if (state.phase !== "preview") return;
    const value = state.items[state.selectedIndex];
    updateIdea(idea.id, { [state.action.targetField]: value } as Partial<Idea>);
    setState({ phase: "closed" });
  }

  const currentAction = state.phase === "loading" || state.phase === "preview" || state.phase === "error" || state.phase === "collecting_platform" ? state.action : null;
  const existingValue = currentAction ? fieldValue(idea, currentAction.targetField) : "";

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          setState((prev) => (prev.phase === "closed" ? { phase: "open" } : { phase: "closed" }));
        }}
        aria-haspopup="true"
        aria-expanded={state.phase !== "closed"}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition-colors ${
          compact
            ? "p-1.5 text-muted-foreground hover:bg-muted hover:text-violet-700 dark:hover:text-violet-300"
            : "border border-border px-2.5 py-1.5 text-xs text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        }`}
      >
        <IconWand className="h-3.5 w-3.5" />
        {!compact && <span>Améliorer avec l&apos;IA</span>}
      </button>

      {state.phase === "open" && (
        <div
          role="menu"
          aria-label="Améliorer avec l'IA"
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
        >
          {QUICK_ACTIONS.map((action) => (
            <button key={action.key} type="button" role="menuitem" onClick={(event) => handlePickAction(event, action)} className={ITEM_CLASS}>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {state.phase === "collecting_platform" && (
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-muted-foreground ">Adapter « {idea.title} » à quelle plateforme ?</p>
          <select
            value={platformDraft}
            onChange={(event) => setPlatformDraft(event.target.value as SocialPlatform)}
            className="mb-2 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            {ALL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABEL[platform]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void execute(state.action, platformDraft)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Générer
            </button>
            <button type="button" onClick={() => setState({ phase: "closed" })} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground ">
              Annuler
            </button>
          </div>
        </div>
      )}

      {state.phase === "loading" && (
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-3 text-xs text-muted-foreground shadow-xl">
          Génération en cours avec Claude…
        </div>
      )}

      {state.phase === "error" && (
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-red-200 bg-surface-elevated p-3 shadow-xl dark:border-red-500/30">
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">{state.message}</p>
          <button type="button" onClick={() => setState({ phase: "closed" })} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground ">
            Fermer
          </button>
        </div>
      )}

      {state.phase === "preview" && (
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-violet-300 bg-surface-elevated p-3 shadow-xl dark:border-violet-500/30">
          <p className="mb-1 text-xs font-semibold text-foreground ">
            Aperçu — {QUICK_ACTION_TARGET_LABEL[state.action.targetField]}
          </p>
          {existingValue && (
            <p className="mb-2 rounded-lg bg-zinc-100 px-2 py-1.5 text-[11px] text-muted-foreground line-through dark:bg-zinc-800/60">
              {existingValue}
            </p>
          )}
          <div className="mb-2 flex flex-col gap-1.5">
            {state.items.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setState({ ...state, selectedIndex: index })}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs ${
                  state.selectedIndex === index
                    ? "border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300"
                    : "border-border text-zinc-700  dark:text-zinc-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleApply} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white">
              {existingValue ? "Remplacer" : "Appliquer"}
            </button>
            <button type="button" onClick={() => setState({ phase: "closed" })} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground ">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
