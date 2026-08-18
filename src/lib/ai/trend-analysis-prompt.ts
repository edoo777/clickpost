import { buildLanguageInstruction } from "@/lib/ai/prompt-context";
import type { ValidatedTrendAnalysisRequest } from "@/lib/ai/validate-trend-analysis-request";
import type { Locale } from "@/lib/i18n/locale";

export interface TrendAnalysisPrompt {
  system: string;
  user: string;
}

/**
 * Prompt d'analyse Claude pour un élément de tendance déjà collecté (vidéo YouTube officielle ou
 * actualité de plateforme officielle) — Claude n'ajoute jamais de tendance, statistique ou source
 * supplémentaire : il explique uniquement la pertinence de la donnée fournie pour la marque/
 * niche fournie. Distinct visuellement côté UI (« Analyse Claude » vs « Donnée de la source »).
 */
export function buildTrendAnalysisPrompt(input: ValidatedTrendAnalysisRequest, language: Locale): TrendAnalysisPrompt {
  const system = `Tu es l'analyste tendances de ClickPost. Tu expliques la pertinence d'un élément déjà collecté depuis une source officielle, pour une marque donnée.

${buildLanguageInstruction(language)}

Règles strictes, non négociables :
- Ne invente JAMAIS de statistique, de tendance supplémentaire, de source, de date ou de fait non présent dans les données fournies ci-dessous.
- Fonde-toi EXCLUSIVEMENT sur l'élément fourni et sur le contexte de marque fourni par l'utilisateur.
- Si une information n'est pas déductible des données fournies, dis-le explicitement (ex. "non déterminable à partir des données disponibles") plutôt que de l'inventer.
- Ta réponse est une analyse, pas une nouvelle donnée factuelle : reste au niveau de l'interprétation et de la recommandation éditoriale.
- Réponds uniquement en JSON valide, sans texte avant ni après, au format exact suivant :
{"relevance": string, "targetBrand": string, "suggestedContentTypes": string[], "suggestedFormats": string[], "suggestedPlatform": string, "risks": string}`;

  const user = `Élément à analyser (donnée source, déjà collectée depuis une source officielle) :
Titre : ${input.title}
${input.summary ? `Résumé : ${input.summary}` : "Résumé : non fourni"}
Plateforme : ${input.platform ?? "non précisée"}
Source : ${input.sourceName} (${input.sourceUrl})

Contexte de marque (fourni par l'utilisateur, ne complète jamais au-delà) :
Marque : ${input.brandName ?? "non précisée"}
Niche : ${input.niche ?? "non précisée"}
Thématiques suivies : ${input.themeLabels.length > 0 ? input.themeLabels.join(", ") : "aucune"}`;

  return { system, user };
}
