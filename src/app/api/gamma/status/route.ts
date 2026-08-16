import { NextResponse } from "next/server";
import { getGammaGenerationStatus, isGammaConfigured } from "@/lib/gamma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/** Interroge l'avancement d'une génération Gamma déjà déclenchée pour un rapport (voir
 * /api/gamma/generate) et met à jour la ligne `reports` correspondante dès que le résultat est
 * connu (succès ou échec) — jamais de statut "prêt" tant que Gamma ne l'a pas confirmé. */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  if (!isGammaConfigured()) {
    return errorResponse("not_configured", "Export PDF Gamma non configuré sur ce serveur.", 503);
  }

  const url = new URL(request.url);
  const reportId = url.searchParams.get("reportId");
  if (!reportId || !UUID_PATTERN.test(reportId)) {
    return errorResponse("invalid_request", "Identifiant de rapport invalide.", 400);
  }

  const { data: reportRow, error: reportError } = await supabase.from("reports").select("*").eq("id", reportId).single();
  if (reportError || !reportRow) return errorResponse("unauthorized", "Rapport introuvable ou inaccessible.", 404);

  const generationId = reportRow.gamma_generation_id as string | null;
  if (!generationId) {
    return errorResponse("invalid_request", "Aucune génération Gamma en cours pour ce rapport.", 400);
  }

  try {
    const result = await getGammaGenerationStatus(generationId);

    if (result.status === "completed") {
      await supabase.from("reports").update({ status: "pdf_ready", stored_file_url: result.fileUrl ?? null }).eq("id", reportId);
    } else if (result.status === "failed") {
      await supabase.from("reports").update({ status: "pdf_failed" }).eq("id", reportId);
    }

    return NextResponse.json({ status: "ok", generation: result });
  } catch (error) {
    console.error("[gamma/status] erreur", error instanceof Error ? error.message : error);
    return errorResponse("provider_unavailable", "Le service Gamma est momentanément indisponible.", 502);
  }
}
