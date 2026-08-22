/**
 * Configuration tarifaire du site public (`/prix` + section tarifs de l'accueil) — fichier unique,
 * modifiable sans toucher à la page. Structure et prix fournis directement par le porteur du
 * produit (jamais inventés côté marketing) — voir `supabase/migrations/20260822000000_beta_access_codes.sql`
 * pour la mise à jour correspondante de la table réelle `plans` (quotas effectivement appliqués
 * par l'application), qui doit rester cohérente avec ces valeurs si elles évoluent.
 *
 * Pour changer un prix, une limite, ou l'ordre d'affichage : modifier UNIQUEMENT ce fichier.
 */

import type { TranslationKey } from "@/lib/i18n/locale-provider";

export interface PricingFeatureCategory {
  /** Clé i18n du libellé de la catégorie (ex. "pricing.category.brands"). */
  labelKey: TranslationKey;
  /** Valeur affichée par plan, dans le même ordre que `PRICING_PLANS` — `null` = illimité,
   * `"included"`/`"unavailable"` pour une fonctionnalité binaire, ou une `TranslationKey` (toute
   * autre chaîne, ex. "pricing.value.basic") pour une valeur qualitative traduite — jamais un
   * texte brut non traduit. */
  values: (number | null | "included" | "unavailable" | TranslationKey)[];
}

export interface PricingPlanConfig {
  key: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** `null` = prix non déterminé ("Nous contacter" affiché) ; sinon prix réel en cents USD. */
  priceUsdCents: number | null;
  /** Met en avant visuellement ce plan (bordure dégradée, étiquette "Recommandé") — un seul plan
   * à la fois, voir `getRecommendedPlanKey()`. */
  recommended?: boolean;
  /** 4 à 5 puces courtes affichées directement sur la carte (voir le mandat : présentation
   * premium façon Make.com, chaque plan doit se comprendre sans devoir lire le tableau
   * comparatif plus bas). */
  highlightKeys: TranslationKey[];
}

export const PRICING_PLANS: PricingPlanConfig[] = [
  {
    key: "creator",
    nameKey: "pricing.plan.creator.name",
    descriptionKey: "pricing.plan.creator.description",
    priceUsdCents: 1900,
    highlightKeys: [
      "pricing.highlight.creator.brands",
      "pricing.highlight.creator.accounts",
      "pricing.highlight.creator.calendar",
      "pricing.highlight.creator.ideaBank",
      "pricing.highlight.creator.ai",
    ],
  },
  {
    key: "creator_pro",
    nameKey: "pricing.plan.creatorPro.name",
    descriptionKey: "pricing.plan.creatorPro.description",
    priceUsdCents: 3900,
    recommended: true,
    highlightKeys: [
      "pricing.highlight.creatorPro.brands",
      "pricing.highlight.creatorPro.accounts",
      "pricing.highlight.creatorPro.ai",
      "pricing.highlight.creatorPro.trends",
      "pricing.highlight.creatorPro.reports",
    ],
  },
  {
    key: "agency",
    nameKey: "pricing.plan.agency.name",
    descriptionKey: "pricing.plan.agency.description",
    priceUsdCents: 9900,
    highlightKeys: [
      "pricing.highlight.agency.brands",
      "pricing.highlight.agency.accounts",
      "pricing.highlight.agency.team",
      "pricing.highlight.agency.approval",
      "pricing.highlight.agency.clientSpaces",
    ],
  },
  {
    key: "agency_pro",
    nameKey: "pricing.plan.agencyPro.name",
    descriptionKey: "pricing.plan.agencyPro.description",
    priceUsdCents: 19900,
    highlightKeys: [
      "pricing.highlight.agencyPro.brands",
      "pricing.highlight.agencyPro.accounts",
      "pricing.highlight.agencyPro.team",
      "pricing.highlight.agencyPro.whiteLabel",
      "pricing.highlight.agencyPro.support",
    ],
  },
];

export const PRICING_FEATURE_CATEGORIES: PricingFeatureCategory[] = [
  { labelKey: "pricing.category.brands", values: [1, 3, 10, 30] },
  { labelKey: "pricing.category.socialAccounts", values: [3, 8, 25, 75] },
  { labelKey: "pricing.category.aiGenerations", values: [50, 250, 750, 2000] },
  { labelKey: "pricing.category.teamMembers", values: [1, 3, 5, 15] },
  { labelKey: "pricing.category.calendar", values: ["included", "included", "included", "included"] },
  { labelKey: "pricing.category.ideaBank", values: ["included", "included", "included", "included"] },
  { labelKey: "pricing.category.analytics", values: ["pricing.value.basic", "pricing.value.advanced", "pricing.value.advanced", "pricing.value.advanced"] },
  { labelKey: "pricing.category.trends", values: ["unavailable", "included", "included", "included"] },
  { labelKey: "pricing.category.reportsPdf", values: ["unavailable", "included", "included", "included"] },
  { labelKey: "pricing.category.approvalWorkflow", values: ["unavailable", "unavailable", "included", "included"] },
  { labelKey: "pricing.category.clientSpaces", values: ["unavailable", "unavailable", "included", "included"] },
  { labelKey: "pricing.category.whiteLabelReports", values: ["unavailable", "unavailable", "unavailable", "included"] },
  { labelKey: "pricing.category.prioritySupport", values: ["unavailable", "unavailable", "included", "included"] },
];

export function getRecommendedPlanKey(): string | undefined {
  return PRICING_PLANS.find((plan) => plan.recommended)?.key;
}
