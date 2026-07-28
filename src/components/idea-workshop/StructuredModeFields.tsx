"use client";

import type { ReactNode } from "react";

interface StructuredModeFieldsProps {
  hook: string;
  onHookChange: (value: string) => void;
  cta: string;
  onCtaChange: (value: string) => void;
  children: ReactNode;
}

/** Mode structuré : Hook / Corps / CTA clairement séparés — le Corps reste le même éditeur riche qu'en mode libre. */
export function StructuredModeFields({ hook, onHookChange, cta, onCtaChange, children }: StructuredModeFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hook</span>
        <textarea
          rows={2}
          value={hook}
          onChange={(event) => onHookChange(event.target.value)}
          placeholder="L'accroche qui capte l'attention…"
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Corps</span>
        <div className="rounded-xl border border-border bg-surface p-4">{children}</div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Appel à l&apos;action (CTA)</span>
        <input
          value={cta}
          onChange={(event) => onCtaChange(event.target.value)}
          placeholder="Ex. Réservez votre place dès maintenant"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </label>
    </div>
  );
}
