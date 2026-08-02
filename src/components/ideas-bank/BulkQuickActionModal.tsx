"use client";

import { useRef, useState } from "react";
import { QUICK_ACTIONS, type QuickActionDefinition, type QuickActionKind } from "@/lib/ai/quick-actions";
import { useBrandsSession } from "@/lib/brands-store";
import { runQuickAction } from "@/lib/banque-quick-action";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { Idea } from "@/types/idea";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
/** Plafond d'une action groupée — protège contre une file d'appels Claude incontrôlée ; aligné
 * sur la taille de lot du Générateur d'idées. */
const MAX_BULK_IDEAS = 20;

interface BulkQuickActionModalProps {
  ideas: Idea[];
  onClose: () => void;
  onDone: () => void;
}

type RunState = { phase: "picking" } | { phase: "confirming" } | { phase: "running"; index: number; success: number; failed: number } | { phase: "done"; success: number; failed: number };

/**
 * Action IA groupée sur la sélection — une seule action, appliquée séquentiellement à chaque
 * idée sélectionnée, jamais plus de MAX_BULK_IDEAS à la fois. Contrairement à l'action sur une
 * seule idée, le résultat est appliqué directement (pas d'aperçu idée par idée) : la
 * confirmation explicite avant de lancer l'opération, avec le nombre d'idées concernées, tient
 * lieu de garde-fou — voir le rapport final pour cette limite assumée.
 */
export function BulkQuickActionModal({ ideas, onClose, onDone }: BulkQuickActionModalProps) {
  const { brands } = useBrandsSession();
  const { updateIdea } = useContentWorkspace();
  const [selectedKey, setSelectedKey] = useState<QuickActionKind | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [state, setState] = useState<RunState>({ phase: "picking" });
  const cancelledRef = useRef(false);

  const action: QuickActionDefinition | undefined = QUICK_ACTIONS.find((candidate) => candidate.key === selectedKey);
  const overLimit = ideas.length > MAX_BULK_IDEAS;

  async function runBulk() {
    if (!action) return;
    cancelledRef.current = false;
    setState({ phase: "running", index: 0, success: 0, failed: 0 });
    let success = 0;
    let failed = 0;
    for (let i = 0; i < ideas.length; i++) {
      if (cancelledRef.current) break;
      const idea = ideas[i];
      const brand = brands.find((candidate) => candidate.id === idea.brandId);
      const outcome = await runQuickAction({
        action: action.key,
        title: idea.title,
        description: idea.description,
        brandTone: action.requiresBrandTone ? brand?.toneOfVoice : undefined,
        targetPlatform: action.requiresPlatform ? platform : undefined,
      });
      if (outcome.status === "ok" && outcome.items[0]) {
        updateIdea(idea.id, { [action.targetField]: outcome.items[0] } as Partial<Idea>);
        success += 1;
      } else {
        failed += 1;
      }
      setState({ phase: "running", index: i + 1, success, failed });
    }
    setState({ phase: "done", success, failed });
  }

  function handleCancelRun() {
    cancelledRef.current = true;
  }

  function handleClose() {
    if (state.phase === "done") onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-xl  ">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground ">Améliorer la sélection avec l&apos;IA</h2>
          <button type="button" onClick={handleClose} aria-label="Fermer" className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted ">
            ✕
          </button>
        </div>

        {overLimit && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            Sélectionnez au maximum {MAX_BULK_IDEAS} idées pour une action groupée (actuellement {ideas.length}).
          </p>
        )}

        {state.phase === "picking" && !overLimit && (
          <>
            <div className="flex flex-col gap-1">
              {QUICK_ACTIONS.map((candidate) => (
                <label key={candidate.key} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input type="radio" name="bulk-action" checked={selectedKey === candidate.key} onChange={() => setSelectedKey(candidate.key)} />
                  {candidate.label}
                </label>
              ))}
            </div>
            {action?.requiresPlatform && (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Plateforme cible
                <select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)} className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm ">
                  {ALL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!action}
                onClick={() => setState({ phase: "confirming" })}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuer
              </button>
              <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground ">
                Annuler
              </button>
            </div>
          </>
        )}

        {state.phase === "confirming" && action && (
          <>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Cette action (« {action.label} ») améliorera <strong>{ideas.length}</strong> idée{ideas.length > 1 ? "s" : ""} avec Claude. Continuer ?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void runBulk()}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Continuer
              </button>
              <button type="button" onClick={() => setState({ phase: "picking" })} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground ">
                Retour
              </button>
            </div>
          </>
        )}

        {state.phase === "running" && (
          <>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Traitement {state.index}/{ideas.length}… ({state.success} réussie{state.success > 1 ? "s" : ""}, {state.failed} échouée{state.failed > 1 ? "s" : ""})
            </p>
            <button type="button" onClick={handleCancelRun} className="w-fit rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground ">
              Arrêter après l&apos;idée en cours
            </button>
          </>
        )}

        {state.phase === "done" && (
          <>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Terminé : {state.success} idée{state.success > 1 ? "s" : ""} améliorée{state.success > 1 ? "s" : ""}
              {state.failed > 0 ? `, ${state.failed} échouée${state.failed > 1 ? "s" : ""}` : ""}.
            </p>
            <button type="button" onClick={handleClose} className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
