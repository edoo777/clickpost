import type { GammaGenerationStatus } from "@/lib/gamma/types";
import type { ReportKpiSnapshot, ReportNarrativeContent } from "@/types/report";

/** Appels client vers /api/ia/rapports/* et /api/gamma/* — jamais d'appel direct à Claude ou à
 * Gamma depuis le navigateur (même règle que trends/client.ts). */

export type RapportsGenerateOutcome =
  | { status: "ok"; narrative: ReportNarrativeContent }
  | { status: "error"; code: string; message: string };

/** Génère la narration complète du rapport (toutes les sections en un seul appel) — c'est
 * désormais l'action IA principale du module Rapports, plus une analyse isolée. */
export async function generateReportNarrative(brandId: string, snapshot: ReportKpiSnapshot): Promise<RapportsGenerateOutcome> {
  try {
    const response = await fetch("/api/ia/rapports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, snapshot }),
    });
    const data = (await response.json().catch(() => null)) as RapportsGenerateOutcome | null;
    if (!data || data.status !== "ok") {
      return {
        status: "error",
        code: (data as { code?: string } | null)?.code ?? `http_${response.status}`,
        message: (data as { message?: string } | null)?.message ?? "Erreur inconnue.",
      };
    }
    return data;
  } catch {
    return { status: "error", code: "network_error", message: "Connexion impossible — vérifiez votre réseau." };
  }
}

export type GammaConfigOutcome = { status: "ok"; configured: boolean } | { status: "error"; message: string };

export async function fetchGammaConfigStatus(): Promise<GammaConfigOutcome> {
  try {
    const response = await fetch("/api/gamma/config");
    const data = (await response.json().catch(() => null)) as GammaConfigOutcome | null;
    if (!data || data.status !== "ok") return { status: "error", message: "Impossible de vérifier la configuration Gamma." };
    return data;
  } catch {
    return { status: "error", message: "Connexion impossible." };
  }
}

export type GammaGenerateOutcome =
  | { status: "ok"; generationId: string }
  | { status: "error"; code: string; message: string };

export async function triggerGammaExport(reportId: string): Promise<GammaGenerateOutcome> {
  try {
    const response = await fetch("/api/gamma/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    const data = (await response.json().catch(() => null)) as GammaGenerateOutcome | null;
    if (!data || data.status !== "ok") {
      return {
        status: "error",
        code: (data as { code?: string } | null)?.code ?? `http_${response.status}`,
        message: (data as { message?: string } | null)?.message ?? "Erreur inconnue.",
      };
    }
    return data;
  } catch {
    return { status: "error", code: "network_error", message: "Connexion impossible — vérifiez votre réseau." };
  }
}

export interface GammaStatusOutcome {
  status: "ok" | "error";
  generation?: { status: GammaGenerationStatus; fileUrl?: string; errorMessage?: string };
  code?: string;
  message?: string;
}

export async function pollGammaStatus(reportId: string): Promise<GammaStatusOutcome> {
  try {
    const response = await fetch(`/api/gamma/status?reportId=${encodeURIComponent(reportId)}`);
    const data = (await response.json().catch(() => null)) as GammaStatusOutcome | null;
    if (!data) return { status: "error", message: `Erreur serveur (${response.status}).` };
    return data;
  } catch {
    return { status: "error", message: "Connexion impossible." };
  }
}
