"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { IconWand } from "@/components/icons";
import { NOTE_QUICK_ACTIONS, type NoteQuickActionDefinition } from "@/lib/ai/quick-actions";
import { runNoteQuickAction } from "@/lib/banque-quick-action";

const ITEM_CLASS =
  "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300";

interface SelectionCapture {
  from: number;
  to: number;
  text: string;
}

type MenuState =
  | { phase: "closed" }
  | { phase: "open" }
  | { phase: "confirmWholeNote"; action: NoteQuickActionDefinition }
  | { phase: "loading"; action: NoteQuickActionDefinition; selection: SelectionCapture | null }
  | { phase: "preview"; action: NoteQuickActionDefinition; items: string[]; selectedIndex: number; selection: SelectionCapture | null }
  | { phase: "error"; message: string };

interface NoteQuickActionsMenuProps {
  editor: Editor | null;
  noteTitle: string;
  brandTone?: string;
  onCreateCopy: (text: string) => void;
}

/**
 * Menu « Améliorer avec l'IA » de l'éditeur de notes — s'applique à la sélection de texte en
 * cours si elle existe, sinon à la note entière après confirmation explicite (jamais
 * silencieusement). Aperçu obligatoire avant toute application, jamais d'écrasement direct.
 */
export function NoteQuickActionsMenu({ editor, noteTitle, brandTone, onCreateCopy }: NoteQuickActionsMenuProps) {
  const [state, setState] = useState<MenuState>({ phase: "closed" });
  const containerRef = useRef<HTMLDivElement>(null);

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

  function currentSelection(): SelectionCapture | null {
    if (!editor) return null;
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    const text = editor.state.doc.textBetween(from, to, " ").trim();
    return text ? { from, to, text } : null;
  }

  function stop(event: React.MouseEvent) {
    event.stopPropagation();
  }

  async function execute(action: NoteQuickActionDefinition, selection: SelectionCapture | null) {
    if (!editor) return;
    const content = selection ? selection.text : editor.getText();
    if (!content.trim()) {
      setState({ phase: "error", message: "Rien à améliorer — la note est vide." });
      return;
    }
    setState({ phase: "loading", action, selection });
    const outcome = await runNoteQuickAction({
      action: action.key,
      title: noteTitle || undefined,
      content,
      brandTone: action.requiresBrandTone ? brandTone : undefined,
    });
    if (outcome.status !== "ok") {
      setState({ phase: "error", message: outcome.message });
      return;
    }
    setState({ phase: "preview", action, items: outcome.items, selectedIndex: 0, selection });
  }

  function handlePickAction(event: React.MouseEvent, action: NoteQuickActionDefinition) {
    stop(event);
    const selection = currentSelection();
    if (!selection) {
      setState({ phase: "confirmWholeNote", action });
      return;
    }
    void execute(action, selection);
  }

  function handleApplyReplace(event: React.MouseEvent) {
    stop(event);
    if (state.phase !== "preview" || !state.selection || !editor) return;
    const value = state.items[state.selectedIndex];
    editor.chain().focus().insertContentAt({ from: state.selection.from, to: state.selection.to }, value).run();
    setState({ phase: "closed" });
  }

  function handleApplyInsertBelow(event: React.MouseEvent) {
    stop(event);
    if (state.phase !== "preview" || !editor) return;
    const value = state.items[state.selectedIndex];
    const insertPos = state.selection ? state.selection.to : editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(insertPos, `\n\n${value}`).run();
    setState({ phase: "closed" });
  }

  function handleApplyCreateCopy(event: React.MouseEvent) {
    stop(event);
    if (state.phase !== "preview") return;
    onCreateCopy(state.items[state.selectedIndex]);
    setState({ phase: "closed" });
  }

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
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
      >
        <IconWand className="h-3.5 w-3.5" />
        Améliorer avec l&apos;IA
      </button>

      {state.phase === "open" && (
        <div role="menu" aria-label="Améliorer avec l'IA" className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl">
          {NOTE_QUICK_ACTIONS.map((action) => (
            <button key={action.key} type="button" role="menuitem" onClick={(event) => handlePickAction(event, action)} className={ITEM_CLASS}>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {state.phase === "confirmWholeNote" && (
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-border bg-surface-elevated p-3 shadow-xl">
          <p className="mb-2 text-xs text-muted-foreground ">
            Aucun texte sélectionné — « {state.action.label} » sera appliqué à toute la note. Continuer ?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void execute(state.action, null)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Continuer
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
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-96 rounded-xl border border-violet-300 bg-surface-elevated p-3 shadow-xl dark:border-violet-500/30">
          <p className="mb-1 text-xs font-semibold text-foreground ">
            Aperçu — {state.action.label}
            {state.selection ? " (sur la sélection)" : " (sur toute la note)"}
          </p>
          <div className="mb-2 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
            {state.items.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setState({ ...state, selectedIndex: index })}
                className={`whitespace-pre-wrap rounded-lg border px-2.5 py-1.5 text-left text-xs ${
                  state.selectedIndex === index
                    ? "border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300"
                    : "border-border text-zinc-700  dark:text-zinc-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.selection && (
              <button type="button" onClick={handleApplyReplace} className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-xs font-semibold text-white">
                Remplacer la sélection
              </button>
            )}
            <button
              type="button"
              onClick={handleApplyInsertBelow}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${state.selection ? "border border-border text-foreground hover:bg-muted" : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"}`}
            >
              Insérer sous le texte
            </button>
            <button type="button" onClick={handleApplyCreateCopy} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted">
              Créer une copie
            </button>
            <button type="button" onClick={() => setState({ phase: "closed" })} className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
