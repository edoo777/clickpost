"use client";

import { useState } from "react";
import { PROMPT_OVERRIDE_LABELS, type PromptOverride } from "@/lib/admin/prompt-override-types";

type Status = "idle" | "saving" | "saved" | "error";

/** Édition d'un complément de prompt IA — toujours ajouté au prompt système existant, jamais un
 * remplacement des règles de sécurité codées en dur (voir la note dans la route API). */
export function PromptOverrideEditor({ override }: { override: PromptOverride }) {
  const [value, setValue] = useState(override.extraInstructions);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [hasPrevious, setHasPrevious] = useState(override.previousExtraInstructions !== null);

  async function handleSave() {
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: override.key, extraInstructions: value }),
      });
      const data = await response.json().catch(() => null);
      if (!data || data.status !== "ok") throw new Error(data?.message ?? "Erreur inconnue.");
      setStatus("saved");
      setHasPrevious(true);
      setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur inconnue.");
    }
  }

  async function handleRestore() {
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: override.key, action: "restore" }),
      });
      const data = await response.json().catch(() => null);
      if (!data || data.status !== "ok") throw new Error(data?.message ?? "Erreur inconnue.");
      window.location.reload();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur inconnue.");
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{PROMPT_OVERRIDE_LABELS[override.key]}</h2>
        {override.updatedAt && (
          <span className="text-xs text-muted-foreground">
            Modifié le {new Date(override.updatedAt).toLocaleString("fr-FR")}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Instructions complémentaires ajoutées à la fin du prompt système existant — jamais un
        remplacement des règles de sécurité (anti-invention de données, format de réponse strict).
        Laisser vide pour revenir au comportement par défaut.
      </p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        placeholder="Aucune instruction complémentaire configurée."
        className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-violet-300 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={status === "saving"}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Enregistrement…" : "Enregistrer"}
        </button>
        {hasPrevious && (
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={status === "saving"}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Restaurer la version précédente
          </button>
        )}
        {status === "saved" && <span className="text-xs text-emerald-600 dark:text-emerald-400">Enregistré.</span>}
        {status === "error" && <span className="text-xs text-red-600 dark:text-red-400">{message}</span>}
      </div>
    </section>
  );
}
