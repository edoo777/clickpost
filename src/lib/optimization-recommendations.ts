import { FORMAT_TO_LABEL_KEY, PLATFORM_LABEL, type PerformanceTotals, type PerformedPublication, type RankedGroup, type TimeSlotCell } from "@/lib/analytics-report";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

/**
 * Chaque recommandation doit annoncer clairement sa nature — jamais présenter une hypothèse comme
 * un fait établi. "finding" = constat direct calculé à partir des données affichées ; "recommendation"
 * = conseil qui en découle raisonnablement ; "hypothesis" = piste à tester, pas une certitude
 * (notamment pour toute publication qui a sous-performé — on ne sait jamais avec certitude
 * pourquoi sans un vrai test).
 */
export type RecommendationKind = "finding" | "recommendation" | "hypothesis";

export type OptimizationActionKey = "new_idea" | "recycle" | "variant" | "calendar" | "test" | "dismiss";

export const ACTION_LABEL: Record<OptimizationActionKey, string> = {
  new_idea: "Transformer en nouvelle idée",
  recycle: "Recycler en autre format",
  variant: "Créer une variante",
  calendar: "Ajouter au calendrier",
  test: "Créer un test",
  dismiss: "Ignorer la recommandation",
};

export interface OptimizationRecommendation {
  id: string;
  kind: RecommendationKind;
  text: string;
  /** Explique concrètement sur quelles données ce constat s'appuie — jamais omis, pour que
   * l'utilisateur puisse juger lui-même de la solidité du constat. */
  dataBasis: string;
  actions: OptimizationActionKey[];
  /** Renseigné quand la recommandation porte sur une publication précise (ex. candidate au
   * recyclage) — permet aux actions "recycle"/"variant"/"test" de savoir quoi utiliser comme base. */
  sourcePublication?: PerformedPublication;
  seedTitle: string;
  seedPlatform?: SocialPlatform;
  seedFormat?: ContentFormat;
}

export interface OptimizationInput {
  topFormat: RankedGroup | null;
  topTheme: RankedGroup | null;
  topPlatform: RankedGroup | null;
  topCta: RankedGroup | null;
  bestTimeSlot: TimeSlotCell | null;
  currentTotals: PerformanceTotals;
  previousTotals: PerformanceTotals | null;
  topPublications: PerformedPublication[];
  worstPublications: PerformedPublication[];
  publishedCount: number;
  periodDays: number;
  brand: Brand | undefined;
}

export function buildOptimizationRecommendations(input: OptimizationInput): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  if (input.topFormat) {
    const label = FORMAT_TO_LABEL_KEY[input.topFormat.key as ContentFormat] ?? input.topFormat.key;
    recommendations.push({
      id: "top-format",
      kind: "recommendation",
      text: `Le format "${label}" génère le meilleur taux d'engagement (${input.topFormat.engagementRate.toFixed(1)}%) sur la période — privilégiez-le dans vos prochaines publications.`,
      dataBasis: `Calculé sur ${input.topFormat.count} publication${input.topFormat.count > 1 ? "s" : ""} au format "${label}" sur la période affichée.`,
      actions: ["variant", "calendar", "dismiss"],
      seedTitle: `Nouvelle publication au format ${label}`,
      seedFormat: input.topFormat.key as ContentFormat,
    });
  }

  if (input.topTheme) {
    recommendations.push({
      id: "top-theme",
      kind: "recommendation",
      text: `La thématique "${input.topTheme.label}" surperforme (${input.topTheme.engagementRate.toFixed(1)}% d'engagement) — envisagez d'en publier davantage.`,
      dataBasis: `Calculé sur ${input.topTheme.count} publication${input.topTheme.count > 1 ? "s" : ""} de cette thématique sur la période affichée.`,
      actions: ["new_idea", "calendar", "dismiss"],
      seedTitle: `Nouvelle idée sur la thématique "${input.topTheme.label}"`,
    });
  }

  if (input.topPlatform) {
    const platformLabel = PLATFORM_LABEL[input.topPlatform.key as SocialPlatform] ?? input.topPlatform.label;
    recommendations.push({
      id: "top-platform",
      kind: "finding",
      text: `${platformLabel} est le réseau le plus engageant sur la période (${input.topPlatform.engagementRate.toFixed(1)}%).`,
      dataBasis: `Calculé sur ${input.topPlatform.count} publication${input.topPlatform.count > 1 ? "s" : ""} sur ${platformLabel} sur la période affichée.`,
      actions: ["dismiss"],
      seedTitle: `Constat — ${platformLabel} le plus engageant`,
    });
  }

  if (input.topCta && input.topCta.count >= 2) {
    recommendations.push({
      id: "top-cta",
      kind: "finding",
      text: `L'appel à l'action "${input.topCta.label}" est associé au meilleur engagement (${input.topCta.engagementRate.toFixed(1)}%) parmi les appels à l'action réutilisés au moins deux fois.`,
      dataBasis: `Calculé sur ${input.topCta.count} publications partageant cet appel à l'action exact sur la période affichée.`,
      actions: ["new_idea", "dismiss"],
      seedTitle: `Nouvelle publication avec l'appel à l'action "${input.topCta.label}"`,
    });
  }

  if (input.bestTimeSlot) {
    recommendations.push({
      id: "best-slot",
      kind: "recommendation",
      text: `Les publications du ${input.bestTimeSlot.weekdayLabel.toLowerCase()} en créneau "${input.bestTimeSlot.slotLabel.toLowerCase()}" obtiennent le meilleur engagement moyen — un bon créneau à privilégier.`,
      dataBasis: `Calculé sur ${input.bestTimeSlot.count} publication${input.bestTimeSlot.count > 1 ? "s" : ""} publiée${input.bestTimeSlot.count > 1 ? "s" : ""} dans ce créneau sur la période affichée.`,
      actions: ["calendar", "dismiss"],
      seedTitle: `Publication programmée le ${input.bestTimeSlot.weekdayLabel} (${input.bestTimeSlot.slotLabel})`,
    });
  }

  if (input.previousTotals) {
    const delta = input.currentTotals.engagementRate - input.previousTotals.engagementRate;
    if (Math.abs(delta) >= 0.1) {
      const direction = delta > 0 ? "en hausse" : "en baisse";
      recommendations.push({
        id: "engagement-trend",
        kind: "finding",
        text: `Le taux d'engagement global est ${direction} de ${Math.abs(delta).toFixed(1)} point${Math.abs(delta) >= 2 ? "s" : ""} par rapport à la période précédente.`,
        dataBasis: `Comparaison entre le taux d'engagement de la période affichée (${input.currentTotals.engagementRate.toFixed(1)}%) et celui de la période précédente équivalente (${input.previousTotals.engagementRate.toFixed(1)}%).`,
        actions: ["dismiss"],
        seedTitle: "Constat — évolution du taux d'engagement",
      });
    }
  }

  if (input.brand?.monthlyPublishingGoal && input.brand.monthlyPublishingGoal > 0) {
    const expected = Math.round((input.brand.monthlyPublishingGoal / 30) * input.periodDays);
    if (expected > 0) {
      const delta = input.publishedCount - expected;
      if (delta < 0) {
        recommendations.push({
          id: "frequency",
          kind: "recommendation",
          text: `${input.publishedCount} publication${input.publishedCount > 1 ? "s" : ""} publiée${input.publishedCount > 1 ? "s" : ""} sur la période, contre ${expected} attendue${expected > 1 ? "s" : ""} au regard de l'objectif mensuel de "${input.brand.name}" (${input.brand.monthlyPublishingGoal}/mois) — augmenter la fréquence de publication pourrait aider à atteindre cet objectif.`,
          dataBasis: `Objectif mensuel de publication défini dans le profil de la marque "${input.brand.name}" (${input.brand.monthlyPublishingGoal}/mois), proraté à la période affichée (${input.periodDays} jour${input.periodDays > 1 ? "s" : ""}).`,
          actions: ["calendar", "dismiss"],
          seedTitle: "Nouvelle publication pour rattraper l'objectif de fréquence",
        });
      }
    }
  } else if (input.publishedCount > 0) {
    recommendations.push({
      id: "frequency-unknown",
      kind: "hypothesis",
      text: "Aucun objectif mensuel de publication n'est défini pour cette marque — impossible de savoir si la fréquence actuelle est suffisante.",
      dataBasis: "Le champ \"Objectif mensuel de publication\" est vide dans le profil de cette marque (onglet Positionnement).",
      actions: ["dismiss"],
      seedTitle: "Définir un objectif mensuel de publication",
    });
  }

  const topCandidate = input.topPublications[0];
  if (topCandidate) {
    recommendations.push({
      id: `top-performer-${topCandidate.id}`,
      kind: "recommendation",
      text: `"${topCandidate.excerpt || "Cette publication"}" a le meilleur taux d'engagement de la période (${topCandidate.engagementRate.toFixed(1)}%) — une variante ou un contenu similaire a de bonnes chances de bien performer aussi.`,
      dataBasis: `Taux d'engagement le plus élevé parmi les publications avec données disponibles sur la période affichée.`,
      actions: ["variant", "recycle", "dismiss"],
      sourcePublication: topCandidate,
      seedTitle: `${topCandidate.excerpt || "Publication"} (variante)`,
      seedPlatform: topCandidate.platform,
      seedFormat: topCandidate.format,
    });
  }

  const worstCandidate = input.worstPublications[0];
  if (worstCandidate && input.topPublications.every((pub) => pub.id !== worstCandidate.id)) {
    recommendations.push({
      id: `recycle-${worstCandidate.id}`,
      kind: "hypothesis",
      text: `"${worstCandidate.excerpt || "Cette publication"}" a le taux d'engagement le plus bas de la période (${worstCandidate.engagementRate.toFixed(1)}%) — essayer un autre format ou une nouvelle accroche pourrait être une piste à tester, sans certitude sur la cause réelle.`,
      dataBasis: `Taux d'engagement le plus bas parmi les publications avec données disponibles sur la période affichée.`,
      actions: ["recycle", "test", "dismiss"],
      sourcePublication: worstCandidate,
      seedTitle: `${worstCandidate.excerpt || "Publication"} (nouvelle tentative)`,
      seedPlatform: worstCandidate.platform,
      seedFormat: worstCandidate.format,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "no-data",
      kind: "finding",
      text: "Pas assez de données sur cette période pour proposer des optimisations.",
      dataBasis: "Aucune publication avec des statistiques disponibles (importées ou de démonstration) sur la période et les filtres actuels.",
      actions: [],
      seedTitle: "",
    });
  }

  return recommendations;
}
