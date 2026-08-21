/**
 * Configuration tarifaire du site public (`/prix`) — fichier unique, modifiable sans toucher à la
 * page. Les valeurs ci-dessous reflètent les plans réellement définis en base (voir la migration
 * `supabase/migrations/20260819000000_analytics_billing_foundations.sql`, table `plans`) — jamais
 * des limites inventées pour la page marketing. `priceUsdCents: null` signifie explicitement
 * "prix non encore déterminé" (c'est le cas réel aujourd'hui pour les plans payants) : la page
 * l'affiche honnêtement comme tel plutôt que d'inventer un montant.
 *
 * Pour changer un prix, une limite, ou l'ordre d'affichage une fois décidés : modifier UNIQUEMENT
 * ce fichier. Si les plans réels de la base évoluent, reporter les mêmes changements ici pour
 * garder la page marketing cohérente avec l'application (aucune lecture réseau depuis cette page,
 * volontairement, pour qu'une page tarifaire publique ne dépende jamais de la disponibilité de la
 * base de données).
 */

import type { TranslationKey } from "@/lib/i18n/locale-provider";

export interface PricingFeatureCategory {
  /** Clé i18n du libellé de la catégorie (ex. "pricing.category.brands"). */
  labelKey: TranslationKey;
  /** Valeur affichée par plan, dans le même ordre que `PRICING_PLANS` — `null` = illimité,
   * `"included"`/`"unavailable"` pour une fonctionnalité binaire plutôt qu'un nombre. */
  values: (number | null | "included" | "unavailable")[];
}

export interface PricingPlanConfig {
  key: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** `null` = prix non déterminé ("Nous contacter" affiché) ; `0` = gratuit. */
  priceUsdCents: number | null;
  /** Met en avant visuellement ce plan (bordure dégradée, étiquette "Recommandé") — un seul plan
   * à la fois, voir `getRecommendedPlanKey()`. */
  recommended?: boolean;
}

export const PRICING_PLANS: PricingPlanConfig[] = [
  { key: "free", nameKey: "pricing.plan.free.name", descriptionKey: "pricing.plan.free.description", priceUsdCents: 0 },
  { key: "starter", nameKey: "pricing.plan.starter.name", descriptionKey: "pricing.plan.starter.description", priceUsdCents: null },
  { key: "pro", nameKey: "pricing.plan.pro.name", descriptionKey: "pricing.plan.pro.description", priceUsdCents: null, recommended: true },
  { key: "agency", nameKey: "pricing.plan.agency.name", descriptionKey: "pricing.plan.agency.description", priceUsdCents: null },
];

/** Catégories demandées par le mandat (marques, comptes sociaux, IA, calendrier intelligent,
 * banque d'idées, analytics, membres d'équipe) — limitées à ce qui existe réellement dans le
 * modèle de données (`Plan`, voir src/types/billing.ts) ou dans le produit lui-même. "Publications
 * par mois", "stockage" et un support différencié par palier ne sont PAS encore modélisés dans le
 * code (aucune colonne, aucune limite appliquée) : volontairement absents ci-dessous plutôt
 * qu'inventés — à ajouter ici dès qu'ils seront réellement définis. */
export const PRICING_FEATURE_CATEGORIES: PricingFeatureCategory[] = [
  { labelKey: "pricing.category.brands", values: [1, 3, 10, null] },
  { labelKey: "pricing.category.socialAccounts", values: [2, 6, 20, null] },
  { labelKey: "pricing.category.aiGenerations", values: [20, 150, 600, null] },
  { labelKey: "pricing.category.teamMembers", values: [1, 3, 10, null] },
  { labelKey: "pricing.category.calendar", values: ["included", "included", "included", "included"] },
  { labelKey: "pricing.category.ideaBank", values: ["included", "included", "included", "included"] },
  { labelKey: "pricing.category.analytics", values: ["unavailable", "included", "included", "included"] },
];

export function getRecommendedPlanKey(): string | undefined {
  return PRICING_PLANS.find((plan) => plan.recommended)?.key;
}
