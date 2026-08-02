"use client";

import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { runTrendAnalysis, type TrendAnalysisResult } from "@/lib/trends/client";

interface AnalysisState {
  status: "idle" | "loading" | "done" | "error";
  result?: TrendAnalysisResult;
  message?: string;
}

/**
 * Bouton « Analyser avec Claude » + panneau de résultat — jamais déclenché automatiquement,
 * réutilisé par TrendCard (YouTube/Actualités) et AdviceSection (Conseils personnalisés) pour
 * éviter deux implémentations divergentes du même appel serveur.
 */
export function TrendAnalysisTrigger({
  trend,
  brandName,
  niche,
  themeLabels,
}: {
  trend: DisplayableTrend;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
}) {
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });

  async function handleAnalyze() {
    setAnalysis({ status: "loading" });
    const outcome = await runTrendAnalysis({
      title: trend.title,
      summary: trend.description,
      platform: trend.platform,
      sourceName: trend.sourceName,
      sourceUrl: trend.sourceUrl ?? trend.url,
      brandName,
      niche,
      themeLabels,
    });
    if (outcome.status === "ok") setAnalysis({ status: "done", result: outcome.analysis });
    else setAnalysis({ status: "error", message: outcome.message });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={analysis.status === "loading"}
        className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {analysis.status === "loading" ? "Analyse en cours…" : "Analyser avec Claude"}
      </button>

      {analysis.status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {analysis.message}
        </p>
      )}

      {analysis.status === "done" && analysis.result && (
        <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-500/20 dark:bg-violet-500/[.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Analyse Claude — interprétation, pas une donnée source
          </p>
          <p className="text-xs text-foreground">{analysis.result.relevance}</p>
          <dl className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">Marque concernée</dt>
              <dd className="text-foreground">{analysis.result.targetBrand}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Plateforme suggérée</dt>
              <dd className="text-foreground">{analysis.result.suggestedPlatform}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Types de contenu</dt>
              <dd className="text-foreground">{analysis.result.suggestedContentTypes.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Formats</dt>
              <dd className="text-foreground">{analysis.result.suggestedFormats.join(", ") || "—"}</dd>
            </div>
          </dl>
          <div>
            <p className="font-medium text-muted-foreground">Risques à éviter</p>
            <p className="text-foreground">{analysis.result.risks}</p>
          </div>
        </div>
      )}
    </div>
  );
}
