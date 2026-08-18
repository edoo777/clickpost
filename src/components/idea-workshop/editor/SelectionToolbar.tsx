"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { RewriteSelectionResult } from "@/lib/content-generation-provider";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";

interface SelectionToolbarProps {
  editor: Editor | null;
  onRewriteSelection: (selectedText: string, instruction: string) => Promise<RewriteSelectionResult>;
}

interface SelectionState {
  text: string;
  from: number;
  to: number;
  top: number;
  left: number;
}

const ACTIONS: { labelKey: TranslationKey; instruction: string }[] = [
  { labelKey: "ideaWorkshop.selectionToolbar.actionRewrite", instruction: "réécrire" },
  { labelKey: "ideaWorkshop.selectionToolbar.actionShorten", instruction: "raccourcir" },
  { labelKey: "ideaWorkshop.selectionToolbar.actionExpand", instruction: "développer" },
  { labelKey: "ideaWorkshop.selectionToolbar.actionCorrect", instruction: "corriger" },
  { labelKey: "ideaWorkshop.selectionToolbar.actionChangeTone", instruction: "changer le ton" },
  { labelKey: "ideaWorkshop.selectionToolbar.actionSimplify", instruction: "simplifier" },
];

/** Barre contextuelle affichée au-dessus d'une sélection de texte, pour les actions IA rapides. */
export function SelectionToolbar({ editor, onRewriteSelection }: SelectionToolbarProps) {
  const t = useTranslations();
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [proposalSource, setProposalSource] = useState<RewriteSelectionResult["source"] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      setProposalSource(null);
    }

    editor.on("selectionUpdate", updateFromSelection);
    return () => {
      editor.off("selectionUpdate", updateFromSelection);
    };
  }, [editor]);

  if (!editor || !selection) return null;

  async function runAction(instruction: string) {
    const currentSelection = selection;
    if (!currentSelection || isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await onRewriteSelection(currentSelection.text, instruction);
      setProposal(result.text);
      setProposalSource(result.source);
    } finally {
      setIsGenerating(false);
    }
  }

  function applyReplace() {
    if (proposal === null || !selection) return;
    editor!.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, proposal).run();
    setSelection(null);
    setProposal(null);
    setProposalSource(null);
  }

  function applyInsertBelow() {
    if (proposal === null || !selection) return;
    editor!.chain().focus().insertContentAt(selection.to, `\n\n${proposal}`).run();
    setSelection(null);
    setProposal(null);
    setProposalSource(null);
  }

  function applyCopy() {
    if (proposal === null) return;
    navigator.clipboard?.writeText(proposal).catch(() => {});
  }

  function cancel() {
    setProposal(null);
    setProposalSource(null);
  }

  const preventBlur = (event: React.MouseEvent) => event.preventDefault();

  return (
    <div
      className="absolute z-40 flex flex-col gap-1 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
      style={{ top: Math.max(selection.top - 52, 0), left: Math.max(selection.left, 0) }}
    >
      {proposal === null ? (
        <div className="flex flex-wrap gap-1" role="toolbar" aria-label={t("ideaWorkshop.selectionToolbar.selectionActions")}>
          {ACTIONS.map((action) => (
            <button
              key={action.labelKey}
              type="button"
              onMouseDown={preventBlur}
              onClick={() => runAction(action.instruction)}
              disabled={isGenerating}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "…" : t(action.labelKey)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex w-72 flex-col gap-2 p-1">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              proposalSource === "claude" ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {proposalSource === "claude"
              ? t("ideaWorkshop.selectionToolbar.generatedByClaude")
              : t("ideaWorkshop.selectionToolbar.demoModeNotice")}
          </span>
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
              {t("ideaWorkshop.selectionToolbar.replace")}
            </button>
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={applyInsertBelow}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              {t("ideaWorkshop.selectionToolbar.insertBelow")}
            </button>
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={applyCopy}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              {t("ideaWorkshop.selectionToolbar.copy")}
            </button>
            <button
              type="button"
              onMouseDown={preventBlur}
              onClick={cancel}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
