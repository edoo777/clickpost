import { buildBrandContextLines, type BrandContextSource } from "@/lib/ai/prompt-context";
import type { ReportKpiSnapshot, ReportType } from "@/types/report";

export interface RapportsGeneratePrompt {
  system: string;
  user: string;
}

function formatSnapshotLines(snapshot: ReportKpiSnapshot): string[] {
  const work = snapshot.workDone;
  const performance = snapshot.performance;

  const lines: Array<string | null> = [
    `Type de rapport : ${snapshot.reportType === "client" ? "rapport client" : snapshot.reportType === "executive" ? "rapport exécutif" : "rapport interne"}`,
    `Période : du ${snapshot.periodStart} au ${snapshot.periodEnd}`,
    `Plateformes filtrées : ${snapshot.platforms.length === 0 ? "toutes" : snapshot.platforms.join(", ")}`,
    "",
    "Travail réalisé (comptages réels ClickPost sur la période) :",
    `- Sujets créés : ${work.topicsCreated}`,
    `- Idées enregistrées : ${work.ideasCreated}`,
    `- Contenus rédigés (versions) : ${work.contentDrafted}`,
    `- Contenus programmés : ${work.contentScheduled}`,
    `- Contenus publiés : ${work.contentPublished}`,
    `- Contenus archivés : ${work.contentArchived}`,
  ];

  if (snapshot.previousWorkDone) {
    const previous = snapshot.previousWorkDone;
    lines.push(
      "Travail réalisé — période précédente (comparaison) :",
      `- Sujets créés : ${previous.topicsCreated}`,
      `- Idées enregistrées : ${previous.ideasCreated}`,
      `- Contenus rédigés : ${previous.contentDrafted}`,
      `- Contenus programmés : ${previous.contentScheduled}`,
      `- Contenus publiés : ${previous.contentPublished}`,
      `- Contenus archivés : ${previous.contentArchived}`
    );
  }

  lines.push(
    "",
    `Production de contenu — total sur la période : ${snapshot.contentProduction.total}`,
    snapshot.contentProduction.byPlatform.length
      ? `Par plateforme : ${snapshot.contentProduction.byPlatform.map((r) => `${r.label} (${r.count})`).join(", ")}`
      : null,
    snapshot.contentProduction.byFormat.length
      ? `Par format : ${snapshot.contentProduction.byFormat.map((r) => `${r.label} (${r.count})`).join(", ")}`
      : null,
    snapshot.contentProduction.byTheme.length
      ? `Par thématique : ${snapshot.contentProduction.byTheme.map((r) => `${r.label} (${r.count})`).join(", ")}`
      : null,
    snapshot.contentProduction.byStatus.length
      ? `Par statut : ${snapshot.contentProduction.byStatus.map((r) => `${r.label} (${r.count})`).join(", ")}`
      : null
  );

  lines.push("", "Performance mesurée :");
  const sourceLabel = performance.sources.hasImported
    ? "données importées manuellement (réelles)"
    : performance.sources.hasDemo
      ? "données de démonstration (jamais réelles, à ne présenter que comme un exemple si mentionnées)"
      : "AUCUNE donnée de performance disponible pour cette période";
  lines.push(`Source des données de performance : ${sourceLabel}`);
  lines.push(`Publications marquées « Publié » sur la période (donnée garantie réelle) : ${performance.publishedCount}`);
  if (performance.previousPublishedCount !== null) {
    lines.push(`Publications publiées — période précédente : ${performance.previousPublishedCount}`);
  }

  if (performance.sources.hasImported || performance.sources.hasDemo) {
    lines.push(
      `Impressions : ${performance.totals.impressions}`,
      `Portée : ${performance.totals.reach}`,
      `Vues : ${performance.totals.views}`,
      `Interactions : ${performance.totals.interactions}`,
      `Taux d'engagement global : ${performance.totals.engagementRate.toFixed(2)}%`,
      `Nouveaux abonnés : ${performance.totals.newFollowers}`
    );
    if (performance.previousTotals) {
      lines.push(
        `Impressions — période précédente : ${performance.previousTotals.impressions}`,
        `Taux d'engagement — période précédente : ${performance.previousTotals.engagementRate.toFixed(2)}%`
      );
    }
    if (performance.platformPerformance.length > 0) {
      lines.push(`Performance par plateforme : ${performance.platformPerformance.map((g) => `${g.label} (${g.engagementRate.toFixed(1)}% d'engagement, ${g.count} publications)`).join(", ")}`);
    }
    if (performance.topPublications.length > 0) {
      lines.push(
        `Meilleures publications : ${performance.topPublications
          .map((pub) => `« ${pub.excerpt.slice(0, 60)} » (${pub.engagementRate.toFixed(1)}% d'engagement)`)
          .join(" ; ")}`
      );
    }
    if (performance.worstPublications.length > 0) {
      lines.push(
        `Publications les moins performantes : ${performance.worstPublications
          .map((pub) => `« ${pub.excerpt.slice(0, 60)} » (${pub.engagementRate.toFixed(1)}% d'engagement)`)
          .join(" ; ")}`
      );
    }
    if (performance.formatPerformance.length > 0) {
      lines.push(`Performance par format : ${performance.formatPerformance.map((g) => `${g.label} (${g.engagementRate.toFixed(1)}%)`).join(", ")}`);
    }
    if (performance.themePerformance.length > 0) {
      lines.push(`Performance par thématique : ${performance.themePerformance.map((g) => `${g.label} (${g.engagementRate.toFixed(1)}%)`).join(", ")}`);
    }
    if (performance.bestTimeSlot) {
      lines.push(
        `Meilleur créneau observé : ${performance.bestTimeSlot.weekdayLabel} ${performance.bestTimeSlot.slotLabel} (${performance.bestTimeSlot.engagementRate.toFixed(1)}%)`
      );
    }
  } else {
    lines.push("Aucune métrique d'engagement disponible pour cette période (pas d'import CSV, démonstration désactivée).");
  }

  if (snapshot.qualitativeGoals.length > 0) {
    lines.push("", `Objectifs qualitatifs déclarés par la marque : ${snapshot.qualitativeGoals.join(", ")}`);
  }

  return lines.filter((line): line is string => Boolean(line));
}

/**
 * Prompt de génération du rapport narratif complet — reçoit uniquement les données déjà calculées
 * côté client (voir build-report-data.ts), jamais de données brutes non agrégées. Produit la
 * narration de TOUTES les sections en un seul appel (remplace l'ancienne action isolée
 * "Analyser avec Claude" : la génération du rapport EST l'appel IA principal du module).
 */
export function buildRapportsGeneratePrompt(params: {
  snapshot: ReportKpiSnapshot;
  brand: BrandContextSource;
  reportType: ReportType;
  /** Compléments configurables depuis l'espace Admin (voir src/lib/admin/prompt-overrides.ts) —
   * systemPromptOverride est prépendu, extraInstructions est ajouté avant la règle de format JSON
   * strict : jamais un remplacement des règles existantes. */
  systemPromptOverride?: string;
  extraInstructions?: string;
}): RapportsGeneratePrompt {
  const { snapshot, brand, reportType, systemPromptOverride, extraInstructions } = params;

  const toneInstruction =
    reportType === "client"
      ? "Le rapport est destiné à être présenté à un client externe par une agence : ton professionnel, synthétique, orienté résultats et valeur, sans jargon interne à ClickPost, chaque section vendant implicitement le travail de l'agence."
      : reportType === "executive"
        ? "Le rapport est destiné à un décideur/dirigeant pressé : très synthétique, orienté impact business et décisions à prendre, minimise le détail opérationnel."
        : "Le rapport est interne, destiné au gestionnaire/à l'équipe : peut être plus détaillé et mentionner explicitement les statuts de production et points de friction opérationnels.";

  const systemLines: Array<string | null> = [
    systemPromptOverride ? `Note de l'administrateur ClickPost : ${systemPromptOverride}` : null,
    "Tu es un analyste stratégique senior qui rédige un rapport de performance de contenu social professionnel pour une agence ou un créateur de contenu.",
    ...buildBrandContextLines(brand),
    toneInstruction,
    extraInstructions ? `Instructions complémentaires (configurées par l'administrateur ClickPost) : ${extraInstructions}` : null,
    "",
    "STYLE DE RÉDACTION OBLIGATOIRE pour chaque texte narratif (executiveSummary.narrative, workDoneNarrative, performanceOverviewNarrative, performanceByPlatformNarrative, contentPerformanceNarrative, aiAnalysis.narrative) : toujours enchaîner CONSTAT → INTERPRÉTATION → RECOMMANDATION, jamais une simple restitution de chiffres. Exemple attendu :",
    '« Le taux d\'engagement progresse de 18 % par rapport à la période précédente. Les contenus éducatifs expliquent principalement cette progression. Nous recommandons d\'augmenter leur présence dans le prochain calendrier éditorial. »',
    "",
    "RÈGLE ABSOLUE : tu ne dois JAMAIS inventer, estimer ou halluciner une métrique (impressions, portée, engagement, abonnés, clics, leads...) qui n'est pas explicitement fournie ci-dessous. Si une section n'a AUCUNE donnée mesurée disponible (regarde la ligne « Source des données de performance »), écris-le explicitement dans la narration de cette section (ex. « Donnée non disponible pour cette période — aucune statistique importée ») plutôt que d'improviser un constat chiffré.",
    "Chaque affirmation chiffrée de ta réponse doit provenir directement des données du message utilisateur ci-dessous.",
    "",
    "Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, exactement de cette forme :",
    '{"executiveSummary":{"narrative":"...","highlights":["...","..."]},"workDoneNarrative":"...","performanceOverviewNarrative":"...","performanceByPlatformNarrative":"...","contentPerformanceNarrative":"...","aiAnalysis":{"narrative":"...","insights":["..."],"anomalies":["..."]},"recommendations":[{"category":"continue","text":"..."}],"actionPlan":[{"text":"...","suggestedTopicTitle":"..."}]}',
    'recommendations[].category doit être exactement une de ces valeurs : "continue" (ce qui fonctionne, à poursuivre), "improve" (à améliorer), "stop" (à arrêter), "test" (à tester). Fournis au moins une recommandation par catégorie pertinente, jamais une catégorie remplie artificiellement si rien ne le justifie.',
    "actionPlan[].suggestedTopicTitle est optionnel : ne le renseigne que si l'action se traduit directement par un titre de sujet de contenu concret et prêt à créer ; sinon omets ce champ.",
    "highlights et insights/anomalies peuvent rester vides si les données ne permettent pas d'en tirer un constat honnête — jamais rempli artificiellement pour faire du volume.",
  ];

  return {
    system: systemLines.filter((line): line is string => Boolean(line)).join("\n"),
    user: formatSnapshotLines(snapshot).join("\n"),
  };
}
