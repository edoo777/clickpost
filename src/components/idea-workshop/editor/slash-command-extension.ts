import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";

export interface SlashMenuItem {
  title: string;
  description: string;
  run: (editor: Editor, range: Range) => void;
}

function buildSlashItems(query: string): SlashMenuItem[] {
  const all: SlashMenuItem[] = [
    {
      title: "Texte",
      description: "Paragraphe normal",
      run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: "Titre 1",
      description: "Grand titre de section",
      run: (editor, range) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
    },
    {
      title: "Titre 2",
      description: "Titre de sous-section",
      run: (editor, range) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
    },
    {
      title: "Titre 3",
      description: "Petit titre",
      run: (editor, range) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
    },
    {
      title: "Liste à puces",
      description: "Liste non ordonnée",
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: "Liste numérotée",
      description: "Liste ordonnée",
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: "Checklist",
      description: "Liste de tâches à cocher",
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: "Citation",
      description: "Bloc de citation",
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: "Séparateur",
      description: "Ligne de séparation",
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
  ];
  if (!query) return all;
  const normalized = query.toLowerCase();
  return all.filter((item) => item.title.toLowerCase().includes(normalized));
}

const ITEM_BASE_CLASS =
  "flex w-full flex-col items-start gap-0 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer";
const ITEM_SELECTED_CLASS = "bg-violet-50 dark:bg-violet-500/10";

function createSlashMenuRenderer() {
  let element: HTMLDivElement | null = null;
  let unmount: (() => void) | null = null;
  let items: SlashMenuItem[] = [];
  let selectedIndex = 0;
  let latestProps: SuggestionProps<SlashMenuItem, SlashMenuItem> | null = null;

  function renderList() {
    if (!element) return;
    element.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "px-3 py-2 text-xs text-muted-foreground";
      empty.textContent = "Aucun bloc trouvé";
      element.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `${ITEM_BASE_CLASS} ${index === selectedIndex ? ITEM_SELECTED_CLASS : "hover:bg-muted"}`;
      const title = document.createElement("span");
      title.className = "text-sm font-medium text-foreground";
      title.textContent = item.title;
      const description = document.createElement("span");
      description.className = "text-xs text-muted-foreground";
      description.textContent = item.description;
      button.appendChild(title);
      button.appendChild(description);
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        latestProps?.command(item);
      });
      element!.appendChild(button);
    });
  }

  return {
    onStart: (props: SuggestionProps<SlashMenuItem, SlashMenuItem>) => {
      items = props.items;
      selectedIndex = 0;
      latestProps = props;
      element = document.createElement("div");
      element.className =
        "z-50 flex max-h-72 w-64 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl";
      renderList();
      unmount = props.mount(element);
    },
    onUpdate: (props: SuggestionProps<SlashMenuItem, SlashMenuItem>) => {
      items = props.items;
      selectedIndex = Math.min(selectedIndex, Math.max(items.length - 1, 0));
      latestProps = props;
      renderList();
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") return true;
      if (props.event.key === "ArrowDown") {
        selectedIndex = items.length === 0 ? 0 : (selectedIndex + 1) % items.length;
        renderList();
        return true;
      }
      if (props.event.key === "ArrowUp") {
        selectedIndex = items.length === 0 ? 0 : (selectedIndex - 1 + items.length) % items.length;
        renderList();
        return true;
      }
      if (props.event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) latestProps?.command(item);
        return true;
      }
      return false;
    },
    onExit: () => {
      unmount?.();
      unmount = null;
      element = null;
      latestProps = null;
    },
  };
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        items: ({ query }: { query: string }) => buildSlashItems(query),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashMenuItem }) => {
          props.run(editor, range);
        },
        render: createSlashMenuRenderer,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashMenuItem, SlashMenuItem>({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
