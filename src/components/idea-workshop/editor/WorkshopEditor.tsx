"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "@/components/idea-workshop/editor/EditorToolbar";
import { SelectionToolbar } from "@/components/idea-workshop/editor/SelectionToolbar";
import { SlashCommand } from "@/components/idea-workshop/editor/slash-command-extension";
import { EMPTY_DOCUMENT } from "@/lib/rich-document";
import type { RewriteSelectionResult } from "@/lib/content-generation-provider";
import type { RichDocument } from "@/types/rich-document";

interface WorkshopEditorProps {
  initialContent?: RichDocument;
  onChange: (doc: RichDocument) => void;
  onRewriteSelection: (selectedText: string, instruction: string) => Promise<RewriteSelectionResult>;
  placeholder?: string;
  editable?: boolean;
}

/**
 * Éditeur riche de type bloc pour l'Atelier de contenu (Tiptap/ProseMirror). Le contenu initial
 * n'est utilisé qu'au montage — pour recharger un contenu différent (changement de version
 * active, restauration), le composant parent doit changer sa `key` afin de remonter un éditeur
 * frais plutôt que de synchroniser `content` en continu (évite de perturber le curseur pendant
 * la frappe).
 */
export function WorkshopEditor({
  initialContent,
  onChange,
  onRewriteSelection,
  placeholder,
  editable = true,
}: WorkshopEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    content: (initialContent ?? EMPTY_DOCUMENT) as JSONContent,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Écrivez, ou tapez « / » pour insérer un bloc…" }),
      SlashCommand,
    ],
    editorProps: {
      attributes: {
        class: "workshop-prose focus:outline-none min-h-[16rem]",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getJSON() as RichDocument);
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <EditorToolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        <SelectionToolbar editor={editor} onRewriteSelection={onRewriteSelection} />
      </div>
    </div>
  );
}
