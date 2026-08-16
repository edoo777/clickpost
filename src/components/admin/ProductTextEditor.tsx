"use client";

import { useState } from "react";
import { PRODUCT_TEXT_LABELS, type ProductText } from "@/lib/admin/product-text-keys";

type Status = "idle" | "saving" | "saved" | "error";

export function ProductTextEditor({ text }: { text: ProductText }) {
  const [value, setValue] = useState(text.value);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [hasPrevious, setHasPrevious] = useState(text.previousValue !== null);

  async function handleSave() {
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: text.key, value }),
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
      const response = await fetch("/api/admin/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: text.key, action: "restore" }),
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
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{PRODUCT_TEXT_LABELS[text.key]}</h2>
        {text.updatedAt && (
          <span className="text-xs text-muted-foreground">Modifié le {new Date(text.updatedAt).toLocaleString("fr-FR")}</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={2}
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
    </div>
  );
}
