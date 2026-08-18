"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import { ActionPlanSection } from "@/components/reports/ActionPlanSection";
import { ContentProductionSection } from "@/components/reports/ContentProductionSection";
import { NarrativeBlock } from "@/components/reports/NarrativeBlock";
import { ObjectivesSection } from "@/components/reports/ObjectivesSection";
import { RecommendationsSection } from "@/components/reports/RecommendationsSection";
import { ReportCoverSection } from "@/components/reports/ReportCoverSection";
import { TopContentSection } from "@/components/reports/TopContentSection";
import { WorkDoneSection } from "@/components/reports/WorkDoneSection";
import { FormatPerformanceChart } from "@/components/performances/FormatPerformanceChart";
import { KpiGrid } from "@/components/performances/KpiGrid";
import { PlatformPerformanceChart } from "@/components/performances/PlatformPerformanceChart";
import { ThemePerformanceChart } from "@/components/performances/ThemePerformanceChart";
import type { ReportDocument, ReportNarrativeContent } from "@/types/report";

/**
 * Aperçu complet du rapport — les 9 sections demandées, dans l'ordre : Couverture, Résumé
 * exécutif, Travail réalisé, Performance globale, Performance par plateforme, Performance des
 * contenus, Analyse IA, Recommandations, Plan d'action. Les données mesurées (KpiGrid, charts,
 * comptages) sont en lecture seule — seule la narration Claude est éditable (`editable=true`),
 * jamais un chiffre. `document` reste local tant que « Enregistrer » n'a pas été cliqué (voir
 * ReportsView).
 */
export function ReportPreview({
  reportDocument,
  editable,
  onNarrativeChange,
  onAddTopic,
}: {
  reportDocument: ReportDocument;
  editable: boolean;
  onNarrativeChange: (next: ReportNarrativeContent) => void;
  onAddTopic: (title: string) => void;
}) {
  const t = useTranslations();
  const { cover, kpi, narrative } = reportDocument;

  function patchNarrative(patch: Partial<ReportNarrativeContent>) {
    onNarrativeChange({ ...narrative, ...patch });
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportCoverSection cover={cover} />

      <ObjectivesSection goals={kpi.qualitativeGoals} />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.preview.executiveSummaryTitle")}</h2>
        <NarrativeBlock
          title={t("reports.preview.synthesisLabel")}
          narrative={narrative.executiveSummary.narrative}
          editable={editable}
          onChange={(text) => patchNarrative({ executiveSummary: { ...narrative.executiveSummary, narrative: text } })}
        />
        {narrative.executiveSummary.highlights.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {narrative.executiveSummary.highlights.map((highlight, index) => (
              <li key={index} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {highlight}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <WorkDoneSection current={kpi.workDone} previous={kpi.previousWorkDone} />
        <NarrativeBlock
          title={t("reports.preview.findingLabel")}
          narrative={narrative.workDoneNarrative}
          editable={editable}
          onChange={(text) => patchNarrative({ workDoneNarrative: text })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.preview.globalPerformanceTitle")}</h2>
        <KpiGrid
          totals={kpi.performance.totals}
          previousTotals={kpi.performance.previousTotals}
          publishedCount={kpi.performance.publishedCount}
          previousPublishedCount={kpi.performance.previousPublishedCount}
          sources={kpi.performance.sources}
        />
        <NarrativeBlock
          title={t("reports.preview.findingLabel")}
          narrative={narrative.performanceOverviewNarrative}
          editable={editable}
          onChange={(text) => patchNarrative({ performanceOverviewNarrative: text })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.preview.platformPerformanceTitle")}</h2>
        <PlatformPerformanceChart data={kpi.performance.platformPerformance} />
        <NarrativeBlock
          title={t("reports.preview.findingLabel")}
          narrative={narrative.performanceByPlatformNarrative}
          editable={editable}
          onChange={(text) => patchNarrative({ performanceByPlatformNarrative: text })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.preview.contentPerformanceTitle")}</h2>
        <ContentProductionSection breakdown={kpi.contentProduction} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormatPerformanceChart data={kpi.performance.formatPerformance} />
          <ThemePerformanceChart data={kpi.performance.themePerformance} />
        </div>
        <TopContentSection top={kpi.performance.topPublications} worst={kpi.performance.worstPublications} />
        <NarrativeBlock
          title={t("reports.preview.findingLabel")}
          narrative={narrative.contentPerformanceNarrative}
          editable={editable}
          onChange={(text) => patchNarrative({ contentPerformanceNarrative: text })}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.preview.aiAnalysisTitle")}</h2>
        <NarrativeBlock
          title={t("reports.preview.interpretationLabel")}
          narrative={narrative.aiAnalysis.narrative}
          editable={editable}
          onChange={(text) => patchNarrative({ aiAnalysis: { ...narrative.aiAnalysis, narrative: text } })}
        />
        {narrative.aiAnalysis.insights.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("reports.preview.insightsLabel")}</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
              {narrative.aiAnalysis.insights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {narrative.aiAnalysis.anomalies.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("reports.preview.anomaliesLabel")}</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
              {narrative.aiAnalysis.anomalies.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <RecommendationsSection
        recommendations={narrative.recommendations}
        editable={editable}
        onChange={(recommendations) => patchNarrative({ recommendations })}
      />

      <ActionPlanSection
        items={narrative.actionPlan}
        editable={editable}
        onChange={(actionPlan) => patchNarrative({ actionPlan })}
        onAddTopic={onAddTopic}
      />
    </div>
  );
}
