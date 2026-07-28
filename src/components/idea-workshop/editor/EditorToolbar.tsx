"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import {
  IconBold,
  IconItalic,
  IconLink,
  IconListBullet,
  IconListCheck,
  IconListNumbered,
  IconMinus,
  IconQuote,
  IconRedo,
  IconUndo,
} from "@/components/icons";

interface EditorToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;
      return {
        h1: ctx.editor.isActive("heading", { level: 1 }),
        h2: ctx.editor.isActive("heading", { level: 2 }),
        h3: ctx.editor.isActive("heading", { level: 3 }),
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        link: ctx.editor.isActive("link"),
        bulletList: ctx.editor.isActive("bulletList"),
        orderedList: ctx.editor.isActive("orderedList"),
        taskList: ctx.editor.isActive("taskList"),
        blockquote: ctx.editor.isActive("blockquote"),
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;

  function handleLink() {
    const previousUrl = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Lien (URL) :", previousUrl ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div
      role="toolbar"
      aria-label="Mise en forme"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1.5 shadow-sm"
    >
      <ToolbarButton active={state.h1} label="Titre 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolbarButton>
      <ToolbarButton active={state.h2} label="Titre 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton active={state.h3} label="Titre 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <Separator />
      <ToolbarButton active={state.bold} label="Gras" onClick={() => editor.chain().focus().toggleBold().run()}>
        <IconBold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton active={state.italic} label="Italique" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <IconItalic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton active={state.link} label="Lien" onClick={handleLink}>
        <IconLink className="h-4 w-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton active={state.bulletList} label="Liste à puces" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <IconListBullet className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton active={state.orderedList} label="Liste numérotée" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <IconListNumbered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton active={state.taskList} label="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <IconListCheck className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton active={state.blockquote} label="Citation" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <IconQuote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Séparateur" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <IconMinus className="h-4 w-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton label="Annuler" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <IconUndo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Rétablir" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <IconRedo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
