"use client";

import { useState } from "react";
import { GammaExportPanel } from "@/components/reports/GammaExportPanel";
import { ReportHistoryList } from "@/components/reports/ReportHistoryList";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { ReportsFilters, type ReportsFiltersValue } from "@/components/reports/ReportsFilters";
import { useAccountsSession } from "@/lib/accounts-store";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { isDemoAnalyticsEnabled } from "@/lib/demo-data-preference";
import { buildIdeaFromSeed } from "@/lib/develop-idea";
import { useImportedMetricsSession } from "@/lib/imported-metrics-store";
import { usePostsSession } from "@/lib/posts-store";
import { buildReportKpiSnapshot } from "@/lib/reports/build-report-data";
import { generateReportNarrative } from "@/lib/reports/client";
import { computeRangeForPreset } from "@/lib/reports/period-presets";
import { useReportsSession } from "@/lib/reports-store";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { Report, ReportCoverMeta, ReportDocument, ReportNarrativeContent } from "@/types/report";

interface GenerationState {
  status: "idle" | "loading" | "error";
  message?: string;
}

function buildInitialFilters(brandId: string): ReportsFiltersValue {
  const today = new Date();
  const range = computeRangeForPreset("30d", today);
  return { brandId, preset: "30d", startDate: range.startDate, endDate: range.endDate, platforms: [], reportType: "internal" };
}

function buildCoverMeta(params: {
  brand: Brand;
  filters: ReportsFiltersValue;
  workspaceName: string;
  generatedByName?: string;
}): ReportCoverMeta {
  const { brand, filters, workspaceName, generatedByName } = params;
  return {
    brandId: brand.id,
    brandName: brand.name,
    brandLogoUrl: brand.logoUrl,
    workspaceName,
    generatedByName,
    reportType: filters.reportType,
    platforms: filters.platforms,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Générateur de rapport professionnel — parcours unique : Filtres → « Générer le rapport »
 * (calcule les KPI réels puis appelle Claude une seule fois pour toute la narration) → Aperçu
 * éditable (9 sections) → Enregistrer → export PDF Gamma (facultatif, désactivé sans clé).
 */
export function ReportsView() {
  const { brands, activeBrand } = useBrandsSession();
  const { accounts } = useAccountsSession();
  const { ideas, topics, topicBatches, contentVersions, addIdea } = useContentWorkspace();
  const { posts } = usePostsSession();
  const { importedMetrics } = useImportedMetricsSession();
  const { reports, addReport, updateReport } = useReportsSession();
  const { workspace, userId, profile } = useWorkspaceSession();

  const [filters, setFilters] = useState<ReportsFiltersValue>(() => buildInitialFilters(activeBrand?.id ?? brands[0]?.id ?? ""));
  const [trackedBrandId, setTrackedBrandId] = useState(activeBrand?.id);
  if (activeBrand?.id !== trackedBrandId) {
    setTrackedBrandId(activeBrand?.id);
    if (activeBrand?.id) setFilters((prev) => ({ ...prev, brandId: activeBrand.id }));
  }

  const [generation, setGeneration] = useState<GenerationState>({ status: "idle" });
  const [reportDocument, setReportDocument] = useState<ReportDocument | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleFiltersChange(next: ReportsFiltersValue) {
    if (next.preset !== filters.preset && next.preset !== "custom") {
      const range = computeRangeForPreset(next.preset, new Date());
      setFilters({ ...next, ...range });
    } else {
      setFilters(next);
    }
    setReportDocument(null);
    setSavedReportId(null);
  }

  const brand = brands.find((candidate) => candidate.id === filters.brandId);
  const demoEnabled = isDemoAnalyticsEnabled();

  async function handleGenerate() {
    if (!brand) return;
    setGeneration({ status: "loading" });
    const snapshot = buildReportKpiSnapshot({
      brand,
      brands,
      accounts,
      reportType: filters.reportType,
      platforms: filters.platforms,
      periodStart: filters.startDate,
      periodEnd: filters.endDate,
      comparePrevious: true,
      topics,
      topicBatches,
      ideas,
      contentVersions,
      publications: posts,
      importedMetrics,
      demoEnabled,
    });

    const outcome = await generateReportNarrative(brand.id, snapshot);
    if (outcome.status !== "ok") {
      setGeneration({ status: "error", message: outcome.message });
      return;
    }

    const generatedByName = profile ? profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() : undefined;
    const cover = buildCoverMeta({ brand, filters, workspaceName: workspace?.name ?? "", generatedByName });

    setReportDocument({ version: 1, cover, kpi: snapshot, narrative: outcome.narrative });
    setSavedReportId(null);
    setGeneration({ status: "idle" });
  }

  function handleNarrativeChange(narrative: ReportNarrativeContent) {
    setReportDocument((prev) => (prev ? { ...prev, narrative } : prev));
  }

  /** Recharge un rapport enregistré tel quel (document + narration éditée conservée) et restaure
   * les filtres qui l'ont produit (marque, période, plateformes, type) — jamais une régénération. */
  function handleOpenReport(report: Report) {
    if (!report.document) return;
    setFilters({
      brandId: report.brandId,
      preset: "custom",
      startDate: report.periodStart,
      endDate: report.periodEnd,
      platforms: report.document.cover.platforms as SocialPlatform[],
      reportType: report.reportType,
    });
    setReportDocument(report.document);
    setSavedReportId(report.id);
    setGeneration({ status: "idle" });
    setSaveError(null);
  }

  function handleAddTopicFromRecommendation(title: string) {
    if (!brand) return;
    const idea = buildIdeaFromSeed({ brandId: brand.id, title });
    addIdea(idea);
    setSaveConfirmation(`« ${title} » ajouté à la Banque d'idées.`);
    setTimeout(() => setSaveConfirmation(null), 3000);
  }

  function handleSaveReport() {
    if (!brand || !reportDocument) return;
    setSaveError(null);
    // Jamais d'enregistrement avec un workspace/utilisateur non résolu : un identifiant vide
    // produirait une ligne invalide (colonnes uuid NOT NULL) qui échouerait silencieusement à la
    // synchronisation plutôt que d'échouer visiblement ici (même risque que le bug theme-nova-1).
    if (!workspace?.id || !userId) {
      setSaveError("Espace de travail en cours de chargement — réessayez dans un instant.");
      return;
    }
    const now = new Date().toISOString();
    const platformLabel = filters.platforms.length > 0 ? filters.platforms.join(",") : "all";

    if (savedReportId) {
      updateReport(savedReportId, { document: reportDocument, summary: reportDocument.narrative.executiveSummary.narrative });
      setSaveConfirmation("Rapport mis à jour.");
    } else {
      const id = crypto.randomUUID();
      addReport({
        id,
        workspaceId: workspace.id,
        brandId: brand.id,
        reportType: filters.reportType,
        periodStart: filters.startDate,
        periodEnd: filters.endDate,
        platform: platformLabel,
        status: "ready",
        summary: reportDocument.narrative.executiveSummary.narrative,
        document: reportDocument,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        revision: 1,
      });
      setSavedReportId(id);
      setSaveConfirmation("Rapport enregistré.");
    }
    setTimeout(() => setSaveConfirmation(null), 3000);
  }

  const brandReports = brand ? reports.filter((report) => report.brandId === brand.id) : [];

  if (brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <p className="rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-10 text-center text-sm text-muted-foreground dark:border-white/[.16]">
          Aucune marque dans ce workspace. Créez-en une dans « Marques » pour générer un rapport.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        Le travail réalisé et la production de contenu sont toujours des comptages réels. Les
        métriques de performance proviennent uniquement d&apos;un import CSV manuel ou, si activées,
        de données de démonstration clairement identifiées. Claude ne fait qu&apos;interpréter ces
        données mesurées — jamais en inventer.
      </p>

      <ReportsFilters value={filters} brands={brands} onChange={handleFiltersChange} />

      {!brand ? (
        <p className="text-sm text-muted-foreground">Sélectionnez une marque pour générer un rapport.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-5">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generation.status === "loading"}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generation.status === "loading" ? "Génération en cours…" : reportDocument ? "Régénérer le rapport" : "Générer le rapport"}
            </button>
            {generation.status === "error" && <span className="text-xs text-red-600 dark:text-red-400">{generation.message}</span>}
          </div>

          {reportDocument && (
            <>
              <ReportPreview
                reportDocument={reportDocument}
                editable
                onNarrativeChange={handleNarrativeChange}
                onAddTopic={handleAddTopicFromRecommendation}
              />

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-5">
                <button
                  type="button"
                  onClick={handleSaveReport}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  {savedReportId ? "Mettre à jour le rapport" : "Enregistrer le rapport"}
                </button>
                {saveConfirmation && <span className="text-xs text-emerald-600 dark:text-emerald-400">{saveConfirmation}</span>}
                {saveError && <span className="text-xs text-red-600 dark:text-red-400">{saveError}</span>}
                <GammaExportPanel reportId={savedReportId} />
              </div>
            </>
          )}

          <ReportHistoryList reports={brandReports} onOpen={handleOpenReport} />
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Rapports</h1>
      <p className="text-sm text-muted-foreground">
        Générez un rapport professionnel — interne, client ou exécutif — sur le travail réalisé et
        la performance d&apos;une marque.
      </p>
    </header>
  );
}
