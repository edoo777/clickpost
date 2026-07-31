import type { GenerationLength, GenerationTone } from "@/lib/assisted-generation";

const TONES: GenerationTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "direct",
  "pedagogical",
  "inspiring",
  "conversational",
  "expert",
  "storytelling",
  "provocative",
];
const LENGTHS: GenerationLength[] = ["short", "medium", "long"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_INSTRUCTIONS_LENGTH = 2000;

export interface GenerationRequestInput {
  ideaId: string;
  tone: GenerationTone;
  length: GenerationLength;
  instructions: string;
}

export type GenerationRequestValidation =
  | { valid: true; value: GenerationRequestInput }
  | { valid: false; message: string };

/**
 * Validation manuelle du corps de requête — pas de nouvelle dépendance (zod) pour une seule
 * route à un seul champ complexe. Rejette tout ce qui n'est pas explicitement attendu plutôt
 * que de laisser passer des valeurs non prévues jusqu'au prompt envoyé à Claude.
 */
export function validateGenerationRequest(body: unknown): GenerationRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { valid: false, message: "Corps de requête invalide." };
  }
  const record = body as Record<string, unknown>;

  const ideaId = record.ideaId;
  if (typeof ideaId !== "string" || !UUID_PATTERN.test(ideaId)) {
    return { valid: false, message: "Identifiant d'idée invalide." };
  }

  const tone = record.tone;
  if (typeof tone !== "string" || !TONES.includes(tone as GenerationTone)) {
    return { valid: false, message: "Ton invalide." };
  }

  const length = record.length;
  if (typeof length !== "string" || !LENGTHS.includes(length as GenerationLength)) {
    return { valid: false, message: "Longueur invalide." };
  }

  const instructionsRaw = record.instructions;
  if (instructionsRaw !== undefined && typeof instructionsRaw !== "string") {
    return { valid: false, message: "Instructions invalides." };
  }
  const instructions = typeof instructionsRaw === "string" ? instructionsRaw.slice(0, MAX_INSTRUCTIONS_LENGTH) : "";

  return {
    valid: true,
    value: { ideaId, tone: tone as GenerationTone, length: length as GenerationLength, instructions },
  };
}
