"use client";

import type { ReactNode } from "react";

/** Bloc de narration Claude générique (constat → interprétation → recommandation) — toujours
 * visuellement distinct d'une donnée mesurée, éditable avant enregistrement du rapport. */
export function NarrativeBlock({
  title,
  narrative,
  editable,
  onChange,
  extra,
}: {
  title: string;
  narrative: string;
  editable: boolean;
  onChange: (next: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/[.06]">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{title}</span>
      {editable ? (
        <textarea
          value={narrative}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-sm leading-6 text-foreground focus:border-violet-400 focus:outline-none dark:border-violet-500/30 dark:bg-black/10"
        />
      ) : (
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{narrative}</p>
      )}
      {extra}
    </div>
  );
}
