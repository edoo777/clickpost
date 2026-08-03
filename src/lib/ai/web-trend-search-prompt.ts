import type { SocialPlatform } from "@/types/dashboard";

export interface WebTrendSearchPromptInput {
  focus: "platform_trends" | "music";
  platforms: SocialPlatform[];
  niche?: string;
  themeLabels: string[];
  country?: string;
  language?: string;
  period: "24h" | "7d" | "30d" | "all";
}

export interface WebTrendSearchPrompt {
  system: string;
  user: string;
}

const PERIOD_LABEL: Record<WebTrendSearchPromptInput["period"], string> = {
  "24h": "les dernières 24 heures",
  "7d": "les 7 derniers jours",
  "30d": "les 30 derniers jours",
  all: "sans contrainte de période stricte, en priorisant le plus récent",
};

const PLATFORM_TRENDS_SCHEMA = `{"items": [{"platform": string, "title": string, "summary": string, "sourceUrl": string, "sourceName": string, "sourceType": "official"|"specialized"|"web_signal", "confidenceLevel": "very_high"|"high"|"medium"|"low", "claimType": "confirmed_trend"|"emerging_signal"|"official_info"|"news"|"unconfirmed_observation", "publishedAt": string|null, "relevanceJustification": string, "corroboratingSourceUrls": string[]}]}`;

const MUSIC_SCHEMA = `{"musicItems": [{"platform": string, "title": string, "artist": string|null, "region": string|null, "sourceUrl": string, "sourceName": string, "sourceType": "official"|"specialized"|"web_signal", "observedAt": string|null, "note": string, "corroboratingSourceUrls": string[]}]}`;

/**
 * Construit le prompt de veille Web — utilisé uniquement par AnthropicWebTrendProvider, jamais
 * automatiquement (voir déclenchement par clic explicite côté route/UI). Encode la hiérarchie de
 * sources (officiel > spécialisé fiable > signal Web recoupé), l'interdiction stricte d'inventer,
 * et la distinction claire entre donnée de source et analyse.
 */
export function buildWebTrendSearchPrompt(input: WebTrendSearchPromptInput): WebTrendSearchPrompt {
  const platformList = input.platforms.join(", ");
  const periodLabel = PERIOD_LABEL[input.period];

  const sharedRules = `Tu es le module de veille Web de ClickPost, utilisé UNIQUEMENT quand aucune API officielle ni aucun flux officiel n'est disponible pour une plateforme, et uniquement après une demande explicite de l'utilisateur (jamais automatique).

Hiérarchie de sources, à respecter strictement dans ton choix et ta classification :
- NIVEAU 1 — officielles : blogs officiels, centres d'aide, documentation, changelogs, communiqués, comptes officiels vérifiables → sourceType "official".
- NIVEAU 2 — spécialisées fiables : médias spécialisés reconnus, publications technologiques reconnues, études documentées avec méthodologie publique, déclarations directement attribuées à la plateforme rapportées par un média reconnu → sourceType "specialized".
- NIVEAU 3 — signaux Web recoupés : toute autre source ne peut être présentée comme confirmée que si au moins une autre source distincte et récente la corrobore → sourceType "web_signal".

Règles strictes, non négociables :
- Tu DOIS utiliser l'outil web_search pour trouver des informations réelles et récentes — ne réponds JAMAIS uniquement depuis ta connaissance interne sans avoir cherché.
- N'invente JAMAIS une source, une date, une statistique, un titre d'article, ou un fait non trouvé dans tes résultats de recherche.
- Chaque "sourceUrl" que tu renvoies DOIT être une URL que tu as réellement vue dans un résultat de web_search au cours de cette conversation — jamais une URL reconstruite, devinée ou mémorisée.
- Si tu n'as trouvé aucune information suffisamment fiable, renvoie une liste vide plutôt que d'inventer un résultat pour remplir la réponse.
- Distingue toujours : tendance confirmée, signal émergent, information officielle, actualité, observation non confirmée — ne présente jamais un signal émergent comme un fait établi.
- Pour toute affirmation concernant algorithmes, monétisation, politiques, droits d'auteur ou changement de règles : privilégie une source officielle ; si tu n'en as pas, classe-la clairement comme "signal émergent", jamais comme confirmée.
- "relevanceJustification" doit expliquer pourquoi c'est pertinent pour la marque/niche donnée — c'est ton analyse, distincte de la donnée de source elle-même.
- Réponds uniquement en JSON valide, sans texte avant ni après, correspondant exactement au schéma demandé.`;

  const context = `Contexte de la recherche :
Plateforme(s) ciblée(s) : ${platformList}
Niche : ${input.niche ?? "non précisée"}
Thématiques suivies : ${input.themeLabels.length > 0 ? input.themeLabels.join(", ") : "aucune"}
Pays : ${input.country ?? "non précisé"}
Langue : ${input.language ?? "non précisée"}
Période : ${periodLabel}`;

  if (input.focus === "music") {
    const musicRules = `Recherche spécifique "Musiques et sons" — contraintes additionnelles strictes :
- Ne télécharge et ne reproduis AUCUN contenu audio, AUCUNE parole de chanson.
- N'invente AUCUN classement, volume d'utilisation ou statistique de popularité non trouvé explicitement dans une source.
- Ne déclare JAMAIS qu'un son est utilisable commercialement sans preuve explicite trouvée dans la source — en cas de doute, "note" doit rester silencieuse sur ce point plutôt que d'affirmer une autorisation.
- Un son "observé comme populaire" reste un signal, jamais une donnée officielle de plateforme, sauf source officielle explicite.

Réponds avec exactement ce schéma JSON : ${MUSIC_SCHEMA}
Maximum 10 éléments. Liste vide si rien de suffisamment fiable.`;

    return {
      system: `${sharedRules}\n\n${musicRules}`,
      user: `${context}\n\nRecherche les musiques/sons actuellement mentionnés comme populaires sur ces plateformes, pour cette niche/région si pertinent, avec des sources identifiables.`,
    };
  }

  const trendsRules = `Réponds avec exactement ce schéma JSON : ${PLATFORM_TRENDS_SCHEMA}
Maximum ${input.platforms.length > 1 ? 30 : 10} éléments au total. Liste vide si rien de suffisamment fiable pour cette période/ces filtres.`;

  return {
    system: `${sharedRules}\n\n${trendsRules}`,
    user: `${context}\n\nRecherche les tendances de contenu actuelles, nouveaux formats, changements d'algorithme, nouvelles fonctionnalités, règles affectant les créateurs, et sujets émergents pertinents pour cette/ces plateforme(s), cette niche et cette période.`,
  };
}
