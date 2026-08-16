/**
 * Types et constantes partagés entre serveur et client pour les compléments de prompt IA —
 * jamais d'import de code serveur ici (voir prompt-overrides.ts pour la lecture/écriture réelle,
 * qui dépend de next/headers et ne doit donc jamais être importé par un composant "use client").
 */
export type PromptOverrideKey = "copilot" | "atelier" | "generateur" | "rapports";

export const PROMPT_OVERRIDE_KEYS: PromptOverrideKey[] = ["copilot", "atelier", "generateur", "rapports"];

export const PROMPT_OVERRIDE_LABELS: Record<PromptOverrideKey, string> = {
  copilot: "Copilote éditorial",
  atelier: "Atelier (génération et réécriture)",
  generateur: "Générateur de sujets",
  rapports: "Rapports — analyse et narration",
};

export interface PromptOverride {
  key: PromptOverrideKey;
  extraInstructions: string;
  previousExtraInstructions: string | null;
  updatedAt: string | null;
}
