import { NextResponse } from "next/server";
import { generateGammaDocument, isGammaConfigured } from "@/lib/gamma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { RECOMMENDATION_CATEGORY_LABEL, type Report, type ReportDocument } from "@/types/report";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/** Construit le contenu texte envoyé à Gamma à partir du ReportDocument — le document structuré
 * (JSON stable, voir src/types/report.ts) reste la source de vérité ; ce texte n'est qu'une mise
 * en forme lisible pour la génération, jamais une seconde source de données. */
function buildGammaContent(document: ReportDocument): string {
  const { cover, narrative } = document;
  const lines: string[] = [
    `# Rapport ${cover.brandName} — ${cover.periodStart} au ${cover.periodEnd}`,
    "",
    "## Résumé exécutif",
    narrative.executiveSummary.narrative,
    "",
    "## Travail réalisé",
    narrative.workDoneNarrative,
    "",
    "## Performance globale",
    narrative.performanceOverviewNarrative,
    "",
    "## Performance par plateforme",
    narrative.performanceByPlatformNarrative,
    "",
    "## Performance des contenus",
    narrative.contentPerformanceNarrative,
    "",
    "## Analyse",
    narrative.aiAnalysis.narrative,
    "",
    "## Recommandations",
    ...narrative.recommendations.map((rec) => `- [${RECOMMENDATION_CATEGORY_LABEL[rec.category]}] ${rec.text}`),
    "",
    "## Plan d'action",
    ...narrative.actionPlan.map((item) => `- ${item.text}`),
  ];
  return lines.join("\n");
}

/** Déclenche une génération PDF Gamma pour un rapport déjà enregistré (voir /api/gamma/status
 * pour interroger l'avancement). L'accès au rapport passe par la session utilisateur normale —
 * la RLS de la table reports (appartenance au workspace) garantit qu'aucun rapport d'un autre
 * workspace ne peut être visé. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  if (!isGammaConfigured()) {
    return errorResponse("not_configured", "Export PDF Gamma non configuré sur ce serveur.", 503);
  }

  const rawBody = await request.json().catch(() => null);
  const reportId = (rawBody as Record<string, unknown> | null)?.reportId;
  if (typeof reportId !== "string" || !UUID_PATTERN.test(reportId)) {
    return errorResponse("invalid_request", "Identifiant de rapport invalide.", 400);
  }

  const { data: reportRow, error: reportError } = await supabase.from("reports").select("*").eq("id", reportId).single();
  if (reportError || !reportRow) return errorResponse("unauthorized", "Rapport introuvable ou inaccessible.", 404);
  const report = mapRowToRecord(reportRow) as unknown as Report;

  if (!report.document) {
    return errorResponse("invalid_request", "Ce rapport n'a pas encore de contenu généré.", 400);
  }
  const content = buildGammaContent(report.document);

  try {
    const result = await generateGammaDocument({
      reportId: report.id,
      title: `Rapport ClickPost — ${report.periodStart} au ${report.periodEnd}`,
      content: content || "Rapport ClickPost",
      templateId: process.env.GAMMA_TEMPLATE_ID,
    });

    await supabase
      .from("reports")
      .update({ status: "generating_pdf", gamma_generation_id: result.generationId })
      .eq("id", reportId);

    return NextResponse.json({ status: "ok", generationId: result.generationId });
  } catch (error) {
    console.error("[gamma/generate] erreur", error instanceof Error ? error.message : error);
    await supabase.from("reports").update({ status: "pdf_failed" }).eq("id", reportId);
    return errorResponse("provider_unavailable", "Le service Gamma est momentanément indisponible.", 502);
  }
}
