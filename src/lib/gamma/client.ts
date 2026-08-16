import type { GammaGenerateRequest, GammaGenerateResult, GammaGenerationStatus, GammaStatusResult } from "@/lib/gamma/types";

/**
 * Client serveur pour l'API Gamma — réservé aux routes serveur sous src/app/api/gamma/, jamais
 * importé par un composant "use client" (GAMMA_API_KEY ne doit jamais atteindre le navigateur,
 * même règle que anthropic-client.ts). Désactivé tant que GAMMA_API_KEY n'est pas configurée —
 * voir isGammaConfigured(), à vérifier par l'appelant avant tout autre usage de ce module.
 *
 * Note de transparence : la forme exacte des appels (endpoints/payload ci-dessous) suit le
 * pattern standard « soumission → polling → URL d'export » d'une API de génération de document
 * asynchrone, au mieux de la documentation publique Gamma connue au moment de l'écriture. Elle
 * doit être vérifiée/ajustée contre la documentation Gamma réelle une fois GAMMA_API_KEY obtenue
 * et un premier appel réel testé — voir le rapport de livraison de ce module.
 */

const GAMMA_API_BASE_URL = "https://public-api.gamma.app/v0.2";

export function isGammaConfigured(): boolean {
  return Boolean(process.env.GAMMA_API_KEY);
}

function getGammaApiKey(): string {
  if (!process.env.GAMMA_API_KEY) {
    throw new Error("GAMMA_API_KEY manquant — vérifier isGammaConfigured() avant d'appeler ce module.");
  }
  return process.env.GAMMA_API_KEY;
}

function normalizeStatus(raw: string | undefined): GammaGenerationStatus {
  if (raw === "completed" || raw === "success" || raw === "done") return "completed";
  if (raw === "failed" || raw === "error") return "failed";
  if (raw === "processing" || raw === "running" || raw === "generating") return "processing";
  return "pending";
}

export async function generateGammaDocument(request: GammaGenerateRequest): Promise<GammaGenerateResult> {
  const apiKey = getGammaApiKey();
  const response = await fetch(`${GAMMA_API_BASE_URL}/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      inputText: request.content,
      textMode: "preserve",
      format: "document",
      exportAs: "pdf",
      themeId: request.templateId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Gamma a refusé la demande de génération (${response.status}).`);
  }
  const data = (await response.json().catch(() => null)) as { generationId?: string; id?: string } | null;
  const generationId = data?.generationId ?? data?.id;
  if (!generationId) throw new Error("Réponse Gamma sans identifiant de génération exploitable.");
  return { generationId, status: "pending" };
}

export async function getGammaGenerationStatus(generationId: string): Promise<GammaStatusResult> {
  const apiKey = getGammaApiKey();
  const response = await fetch(`${GAMMA_API_BASE_URL}/generations/${encodeURIComponent(generationId)}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!response.ok) {
    throw new Error(`Impossible d'obtenir le statut de la génération Gamma (${response.status}).`);
  }
  const data = (await response.json().catch(() => null)) as { status?: string; exportUrl?: string; fileUrl?: string; error?: string } | null;
  const status = normalizeStatus(data?.status);
  return {
    generationId,
    status,
    fileUrl: data?.exportUrl ?? data?.fileUrl,
    errorMessage: status === "failed" ? (data?.error ?? "Échec de génération Gamma.") : undefined,
  };
}
