"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { fetchGammaConfigStatus, pollGammaStatus, triggerGammaExport } from "@/lib/reports/client";

type PanelState =
  | { status: "checking" }
  | { status: "not_configured" }
  | { status: "idle" }
  | { status: "generating" }
  | { status: "ready"; fileUrl?: string }
  | { status: "failed"; message: string };

/** Export PDF Gamma — reste entièrement inoffensif tant que GAMMA_API_KEY n'est pas configurée
 * côté serveur : le bouton devient un message clair, jamais un faux succès. */
export function GammaExportPanel({ reportId }: { reportId: string | null }) {
  const t = useTranslations();
  const [state, setState] = useState<PanelState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    fetchGammaConfigStatus().then((outcome) => {
      if (cancelled) return;
      setState(outcome.status === "ok" && outcome.configured ? { status: "idle" } : { status: "not_configured" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "generating" || !reportId) return;
    const interval = setInterval(() => {
      void pollGammaStatus(reportId).then((outcome) => {
        if (outcome.status !== "ok" || !outcome.generation) return;
        if (outcome.generation.status === "completed") {
          setState({ status: "ready", fileUrl: outcome.generation.fileUrl });
        } else if (outcome.generation.status === "failed") {
          setState({ status: "failed", message: outcome.generation.errorMessage ?? t("reports.gammaExport.genericFailure") });
        }
      });
    }, 4000);
    return () => clearInterval(interval);
    // `t` volontairement exclu : ne redémarrerait qu'inutilement le minuteur de sondage à chaque
    // changement de langue, jamais une donnée obsolète affichée après un changement de langue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, reportId]);

  async function handleGenerate() {
    if (!reportId) return;
    setState({ status: "generating" });
    const outcome = await triggerGammaExport(reportId);
    if (outcome.status !== "ok") setState({ status: "failed", message: outcome.message });
  }

  if (state.status === "checking") return null;

  if (state.status === "not_configured") {
    return (
      <span className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {t("reports.gammaExport.notConfigured")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={!reportId || state.status === "generating"}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "generating" ? t("reports.gammaExport.generating") : t("reports.gammaExport.generateButton")}
      </button>
      {!reportId && <span className="text-xs text-muted-foreground">{t("reports.gammaExport.saveBeforeExport")}</span>}
      {state.status === "ready" && state.fileUrl && (
        <a href={state.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
          {t("reports.gammaExport.downloadPdf")}
        </a>
      )}
      {state.status === "failed" && <span className="text-xs text-red-600 dark:text-red-400">{state.message}</span>}
    </div>
  );
}
