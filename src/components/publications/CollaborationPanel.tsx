"use client";

import { useState, type ReactNode } from "react";
import type { Publication } from "@/types/publication";
import type { TeamMember } from "@/types/team";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderWithMentions(text: string, members: TeamMember[]): ReactNode {
  if (members.length === 0) return text;

  const names = [...members].map((member) => member.name).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`@(${names.map(escapeRegExp).join("|")})`, "g");
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <span
        key={`mention-${key++}`}
        className="rounded bg-blue-100 px-1 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

interface CollaborationPanelProps {
  publication: Publication;
  members: TeamMember[];
  currentUserName: string;
  onAddComment: (audience: "internal" | "client", text: string) => void;
}

export function CollaborationPanel({
  publication,
  members,
  currentUserName,
  onAddComment,
}: CollaborationPanelProps) {
  const [audience, setAudience] = useState<"internal" | "client">("internal");
  const [text, setText] = useState("");

  function insertMention(name: string) {
    setText((prev) => (prev.length > 0 && !prev.endsWith(" ") ? `${prev} @${name} ` : `${prev}@${name} `));
  }

  function handleSubmit() {
    if (text.trim().length === 0) return;
    onAddComment(audience, text.trim());
    setText("");
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Commentaires</h2>

      {publication.comments.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Aucun commentaire pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {publication.comments.map((comment) => (
            <li
              key={comment.id}
              className="flex flex-col gap-1 rounded-lg border border-zinc-100 p-3 dark:border-white/[.06]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{comment.authorName}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      comment.audience === "client"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {comment.audience === "client" ? "Client" : "Interne"}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                    {dateFormatter.format(new Date(comment.createdAt))}
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{renderWithMentions(comment.text, members)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-white/[.06]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-white/[.08]">
            <button
              type="button"
              onClick={() => setAudience("internal")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                audience === "internal"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Interne
            </button>
            <button
              type="button"
              onClick={() => setAudience("client")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                audience === "client"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Client
            </button>
          </div>

          {members.length > 0 && (
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) insertMention(event.target.value);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-400"
            >
              <option value="">Mentionner…</option>
              {members.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <textarea
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ajouter un commentaire…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200"
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
        >
          Commenter en tant que {currentUserName}
        </button>
      </div>
    </section>
  );
}
