/**
 * Types et constantes partagés entre serveur et client pour les textes produit — jamais d'import
 * de code serveur ici (voir product-texts.ts pour la lecture/écriture réelle, qui dépend de
 * next/headers et ne doit donc jamais être importé par un composant "use client").
 */
export type ProductTextKey =
  | "onboarding_welcome_title"
  | "onboarding_welcome_subtitle"
  | "coming_soon_other_networks";

export const PRODUCT_TEXT_DEFAULTS: Record<ProductTextKey, string> = {
  onboarding_welcome_title: "Bienvenue sur ClickPost",
  onboarding_welcome_subtitle: "Configurons votre espace de travail en quelques étapes.",
  coming_soon_other_networks: "Bientôt disponible — cette plateforme n'est pas encore connectée à ClickPost.",
};

export const PRODUCT_TEXT_LABELS: Record<ProductTextKey, string> = {
  onboarding_welcome_title: "Titre d'accueil de l'onboarding",
  onboarding_welcome_subtitle: "Sous-titre d'accueil de l'onboarding",
  coming_soon_other_networks: "Message « bientôt disponible » pour un réseau non connecté",
};

export const PRODUCT_TEXT_KEYS = Object.keys(PRODUCT_TEXT_DEFAULTS) as ProductTextKey[];

export interface ProductText {
  key: ProductTextKey;
  value: string;
  previousValue: string | null;
  updatedAt: string | null;
}
