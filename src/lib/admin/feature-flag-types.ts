/**
 * Types partagés entre serveur et client pour les interrupteurs de fonctionnalité — jamais
 * d'import de code serveur ici (voir feature-flags.ts pour la lecture/écriture réelle, qui
 * dépend de next/headers et ne doit donc jamais être importé par un composant "use client").
 */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string | null;
}
