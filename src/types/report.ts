import type { DataSourceSummary, PerformanceTotals, RankedGroup, TimeSlotCell } from "@/lib/analytics-report";

export type ReportType = "internal" | "client" | "executive";

export type ReportStatus = "draft" | "ready" | "generating_pdf" | "pdf_ready" | "pdf_failed";

/** Historique persistant d'un rapport généré — jamais la source de calcul (voir
 * src/lib/reports/build-report-data.ts, qui calcule tout côté client à partir des données déjà
 * synchronisées). Cette table ne fait qu'enregistrer le résultat au moment où l'utilisateur
 * enregistre un rapport. `document` porte l'intégralité du rapport (KPI + narration Claude,
 * potentiellement éditée par l'utilisateur avant enregistrement) — voir ReportDocument. */
export interface Report {
  id: string;
  workspaceId: string;
  brandId: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  /** Plateformes filtrées, séparées par virgule (ou "all") — miroir texte de `document.cover.platforms`
   * pour un affichage rapide dans l'historique sans désérialiser tout le document. */
  platform: string;
  status: ReportStatus;
  summary?: string;
  document?: ReportDocument;
  gammaGenerationId?: string;
  storedFileUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  revision: number;
}

export interface RankedCount {
  key: string;
  label: string;
  count: number;
}

/** Décompte du travail réellement effectué dans ClickPost sur la période — jamais une estimation :
 * chaque champ est un comptage direct d'enregistrements réels (sujets/idées/versions/publications). */
export interface ReportWorkItemCounts {
  topicsCreated: number;
  ideasCreated: number;
  contentDrafted: number;
  contentScheduled: number;
  contentPublished: number;
  contentArchived: number;
}

export interface ReportContentBreakdown {
  total: number;
  byPlatform: RankedCount[];
  byFormat: RankedCount[];
  byTheme: RankedCount[];
  byStatus: RankedCount[];
}

export interface ReportPublicationSummary {
  id: string;
  excerpt: string;
  platform: string;
  format: string;
  scheduledFor: string;
  engagementRate: number;
  source: "imported" | "demo";
}

/** Section performance — mêmes fonctions/formes que le module Performances
 * (src/lib/analytics-report.ts), jamais une seconde implémentation. */
export interface ReportPerformanceSnapshot {
  sources: DataSourceSummary;
  totals: PerformanceTotals;
  previousTotals: PerformanceTotals | null;
  publishedCount: number;
  previousPublishedCount: number | null;
  topPublications: ReportPublicationSummary[];
  worstPublications: ReportPublicationSummary[];
  platformPerformance: RankedGroup[];
  formatPerformance: RankedGroup[];
  themePerformance: RankedGroup[];
  bestTimeSlot: TimeSlotCell | null;
}

/** Payload structuré complet des données mesurées d'un rapport — calculé côté client, jamais
 * inventé. Sert à la fois à l'affichage et de contexte envoyé à Claude (voir rapports-prompt.ts).
 * `platforms` vide = toutes les plateformes (voir matchesPlatform dans analytics-report.ts). */
export interface ReportKpiSnapshot {
  brandId: string;
  brandName: string;
  reportType: ReportType;
  platforms: string[];
  periodStart: string;
  periodEnd: string;
  hasPreviousPeriod: boolean;
  workDone: ReportWorkItemCounts;
  previousWorkDone: ReportWorkItemCounts | null;
  contentProduction: ReportContentBreakdown;
  performance: ReportPerformanceSnapshot;
  /** Objectifs qualitatifs déclarés par la marque (`communicationGoals`) — jamais de comparaison
   * cible/réalisé chiffrée : aucune cible numérique n'est configurable dans ClickPost aujourd'hui. */
  qualitativeGoals: string[];
}

export type RecommendationCategory = "continue" | "improve" | "stop" | "test";

export const RECOMMENDATION_CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  continue: "Continuer",
  improve: "Améliorer",
  stop: "Arrêter",
  test: "Tester",
};

export interface ReportRecommendation {
  category: RecommendationCategory;
  /** Rédigé en constat → interprétation → recommandation (voir rapports-prompt.ts) — jamais une
   * simple liste de mots-clés. */
  text: string;
}

export interface ReportActionPlanItem {
  text: string;
  /** Titre de sujet prêt à être ajouté à la Banque d'idées en un clic — absent si l'action n'est
   * pas directement actionnable comme un sujet. */
  suggestedTopicTitle?: string;
}

/** Métadonnées de la page de couverture — jamais générées par Claude, toujours dérivées de
 * données réelles ClickPost (marque, workspace, profil de l'utilisateur qui génère). */
export interface ReportCoverMeta {
  brandId: string;
  brandName: string;
  brandLogoUrl?: string;
  workspaceName: string;
  generatedByName?: string;
  reportType: ReportType;
  platforms: string[];
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}

/** Narration Claude structurée par section — toujours une interprétation, jamais une donnée
 * mesurée (voir la distinction visuelle imposée côté UI). Un texte de narration doit dire
 * explicitement « Donnée non disponible » plutôt que d'improviser lorsque la section correspondante
 * du ReportKpiSnapshot ne contient rien de mesurable. */
export interface ReportNarrativeContent {
  executiveSummary: {
    narrative: string;
    highlights: string[];
  };
  workDoneNarrative: string;
  performanceOverviewNarrative: string;
  performanceByPlatformNarrative: string;
  contentPerformanceNarrative: string;
  aiAnalysis: {
    narrative: string;
    insights: string[];
    anomalies: string[];
  };
  recommendations: ReportRecommendation[];
  actionPlan: ReportActionPlanItem[];
}

/**
 * Objet JSON stable représentant l'intégralité d'un rapport — combine les données réellement
 * mesurées (`kpi`, jamais inventées) et la narration Claude (`narrative`, toujours distincte
 * visuellement). Structure prête à être envoyée telle quelle à Gamma pour générer le PDF final.
 * `version` permet de faire évoluer la forme sans casser les rapports déjà enregistrés.
 */
export interface ReportDocument {
  version: 1;
  cover: ReportCoverMeta;
  kpi: ReportKpiSnapshot;
  narrative: ReportNarrativeContent;
}
