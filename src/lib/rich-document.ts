import type { RichDocument } from "@/types/rich-document";

export const EMPTY_DOCUMENT: RichDocument = { type: "doc", content: [{ type: "paragraph" }] };

interface DocNode {
  type?: string;
  text?: string;
  content?: DocNode[];
}

export function isEmptyDocument(doc: RichDocument | undefined): boolean {
  if (!doc?.content) return true;
  return doc.content.every((node) => extractBlockText(node as DocNode).trim().length === 0);
}

/** Convertit un texte brut (ex. contenu généré par l'assistant) en document riche minimal. */
export function plainTextToDocument(text: string): RichDocument {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return EMPTY_DOCUMENT;
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }],
    })),
  };
}

function extractInlineText(node: DocNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  if (Array.isArray(node.content)) return node.content.map(extractInlineText).join("");
  return "";
}

function extractBlockText(node: DocNode | undefined): string {
  if (!node) return "";
  switch (node.type) {
    case "paragraph":
    case "heading":
      return extractInlineText(node);
    case "bulletList":
    case "orderedList":
    case "taskList":
      return (node.content ?? []).map((item) => `• ${extractBlockText(item)}`).join("\n");
    case "listItem":
    case "taskItem":
      return (node.content ?? []).map(extractBlockText).join(" ");
    case "blockquote":
      return `« ${(node.content ?? []).map(extractBlockText).join(" ")} »`;
    case "horizontalRule":
      return "---";
    default:
      if (Array.isArray(node.content)) return node.content.map(extractBlockText).join(" ");
      return "";
  }
}

/** Miroir texte brut du document riche — utilisé pour `Idea.body`, la recherche et la publication. */
export function documentToPlainText(doc: RichDocument | undefined): string {
  if (!doc?.content) return "";
  return doc.content
    .map((node) => extractBlockText(node as DocNode))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
