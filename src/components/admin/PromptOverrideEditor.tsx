"use client";

import { useState } from "react";
import { PROMPT_OVERRIDE_LABELS, type PromptOverride } from "@/lib/admin/prompt-override-types";
import { useTranslations } from "@/lib/i18n/locale-provider";

type Status = "idle" | "saving" | "saved" | "error";

/** Édition d'un prompt IA administrable — identifiant (clé), nom, fonction concernée (libellé
 * fixe), statut actif/inactif, prompt système (prépendu) et instructions supplémentaires
 * (ajoutées) — jamais un remplacement des règles de sécurité codées en dur (anti-invention de
 * données, format de réponse strict), toujours un complément. */
export function PromptOverrideEditor({ override }: { override: PromptOverride }) {
  const t = useTranslations();
  const [name, setName] = useState(override.name || PROMPT_OVERRIDE_LABELS[override.key]);
  const [isActive, setIsActive] = useState(override.isActive);
  const [systemPromptOverride, setSystemPromptOverride] = useState(override.systemPromptOverride);
  const [extraInstructions, setExtraInstructions] = useState(override.extraInstructions);
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
        body: JSON.stringify({ key: override.key, name, isActive, systemPromptOverride, extraInstructions }),
      });
      const data = await response.json().catch(() => null);
      if (!data || data.status !== "ok") throw new Error(data?.message ?? t("admin.promptOverrideEditor.unknownError"));
      setStatus("saved");
      setHasPrevious(true);
      setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("admin.promptOverrideEditor.unknownError"));
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
      if (!data || data.status !== "ok") throw new Error(data?.message ?? t("admin.promptOverrideEditor.unknownError"));
      window.location.reload();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("admin.promptOverrideEditor.unknownError"));
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.promptOverrideEditor.functionLabel", {
              function: PROMPT_OVERRIDE_LABELS[override.key],
              key: override.key,
              version: override.version,
            })}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={PROMPT_OVERRIDE_LABELS[override.key]}
            className="w-full max-w-sm rounded-lg border border-border bg-transparent px-2 py-1 text-sm font-semibold text-foreground focus:border-violet-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          {override.updatedAt && (
            <span className="text-xs text-muted-foreground">
              {t("admin.promptOverrideEditor.modifiedOn", { date: new Date(override.updatedAt).toLocaleString("fr-FR") })}
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((prev) => !prev)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isActive ? "bg-violet-600" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            {isActive ? t("admin.promptOverrideEditor.active") : t("admin.promptOverrideEditor.inactive")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("admin.promptOverrideEditor.systemPromptLabel")}
        </label>
        <p className="text-xs text-muted-foreground">{t("admin.promptOverrideEditor.systemPromptHint")}</p>
        <textarea
          value={systemPromptOverride}
          onChange={(event) => setSystemPromptOverride(event.target.value)}
          rows={3}
          placeholder={t("admin.promptOverrideEditor.systemPromptPlaceholder")}
          className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-violet-300 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("admin.promptOverrideEditor.extraInstructionsLabel")}
        </label>
        <textarea
          value={extraInstructions}
          onChange={(event) => setExtraInstructions(event.target.value)}
          rows={4}
          placeholder={t("admin.promptOverrideEditor.extraInstructionsPlaceholder")}
          className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-violet-300 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={status === "saving"}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? t("common.saving") : t("common.save")}
        </button>
        {hasPrevious && (
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={status === "saving"}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("admin.promptOverrideEditor.restorePreviousInstructions")}
          </button>
        )}
        {status === "saved" && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">{t("admin.promptOverrideEditor.saved")}</span>
        )}
        {status === "error" && <span className="text-xs text-red-600 dark:text-red-400">{message}</span>}
      </div>
    </section>
  );
}
