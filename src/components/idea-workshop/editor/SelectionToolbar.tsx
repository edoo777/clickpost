"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

interface SelectionToolbarProps {
  editor: Editor | null;
  onRewriteSelection: (selectedText: string, instruction: string) => string;
}

interface SelectionState {
  text: string;
  from: number;
  to: number;
  top: number;
  left: number;
}

const ACTIONS: { label: string; instruction: string }[] = [
  { label: "Réécrire", instruction: "réécrire" },
  { label: "Raccourcir", instruction: "raccourcir" },
  { label: "Développer", instruction: "développer" },
  { label: "Corriger", instruction: "corriger" },
  { label: "Changer le ton", instruction: "changer le ton" },
  { label: "Simplifier", instruction: "simplifier" },
];

/** Barre contextuelle affichée au-dessus d'une sélection de texte, pour les actions IA rapides. */
export function SelectionToolbar({ editor, onRewriteSelection }: SelectionToolbarProps) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    function updateFromSelection() {
      const { from, to, empty } = editor!.state.selection;
      if (empty) {
        setSelection(null);
        setProposal(null);
        return;
      }
      const text = editor!.state.doc.textBetween(from, to, " ");
      if (!text.trim()) {
        setSelection(null);
        return;
      }
      const coords = editor!.view.coordsAtPos(from);
      const containerRect = editor!.view.dom.getBoundingClientRect();
      setSelection({ text, from, to, top: coords.top - containerRect.top, left: coords.left - containerRect.left });
      setProposal(null);
    }

    editor.on("selectionUpdate", updateFromSelection);
    return () => {
      editor.off("selectionUpdate", updateFromSelection);
    };
  }, [editor]);

  if (!editor || !selection) return null;

  function runAction(instruction: string) {
    const result = onRewriteSelection(selection!.text, instruction);
    setProposal(result);
  }

  function applyReplace() {
    if (proposal === null || !selection) return;
    editor!.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, proposal).run();
    setSelection(null);
    setProposal(null);
  }

  function applyInsertBelow() {
    if (proposal === null || !selection) return;
    editor!.chain().focus().insertContentAt(selection.to, `\n\n${proposal}`).run();
    setSelection(null);
    setProposal(null);
  }

  function applyCopy() {
    if (proposal === null) return;
    navigator.clipboard?.writeText(proposal).catch(() => {});
  }

  function cancel() {
    setProposal(null);
  }

  const preventBlur = (event: React.MouseEvent) => event.preventDefault();

  return (
    <div
      className="absolute z-40 flex flex-col gap-1 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
      style={{ top: Math.max(selection.top - 52, 0), left: Math.max(selection.left, 0) }}
    >
      {proposal === null ? (
        <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Actions sur la sélection">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onMouseDown={preventBlur}
              onClick={() => runAction(action.instruction)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex w-72 flex-col gap-2 p-1">
          <p className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-2 text-xs text-foreground">
            {proposal}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={applyReplace}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-xs font-semibold text-white"
            >
              Remplacer
            </button>
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={applyInsertBelow}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              Insérer en dessous
            </button>
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={applyCopy}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              Copier
            </button>
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={cancel}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
