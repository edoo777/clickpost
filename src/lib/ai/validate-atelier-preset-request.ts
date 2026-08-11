import type { ContentFormat } from "@/types/editorial-calendar";
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
const MAX_CURRENT_TEXT_LENGTH = 12000;
const CONTENT_FORMATS: ContentFormat[] = ["text", "carousel", "image", "short_video", "story", "article"];

export interface AtelierPresetRequestInput {
  ideaId: string;
  presetId: string;
  tone: GenerationTone;
  length: GenerationLength;
  instructions: string;
  currentText?: string;
  currentFormat?: ContentFormat;
}

export type AtelierPresetRequestValidation =
  | { valid: true; value: AtelierPresetRequestInput }
  | { valid: false; message: string };

export function validateAtelierPresetRequest(body: unknown): AtelierPresetRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { valid: false, message: "Corps de requête invalide." };
  }

  const record = body as Record<string, unknown>;

  const ideaId = record.ideaId;
  if (typeof ideaId !== "string" || !UUID_PATTERN.test(ideaId)) {
    return { valid: false, message: "Identifiant d'idée invalide." };
  }

  const presetId = record.presetId;
  if (typeof presetId !== "string" || !presetId.trim()) {
    return { valid: false, message: "Identifiant de preset invalide." };
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

  const currentTextRaw = record.currentText;
  let currentText: string | undefined;
  if (currentTextRaw !== undefined) {
    if (typeof currentTextRaw !== "string") {
      return { valid: false, message: "Texte actuel invalide." };
    }
    currentText = currentTextRaw.trim().slice(0, MAX_CURRENT_TEXT_LENGTH);
  }

  const currentFormatRaw = record.currentFormat;
  let currentFormat: ContentFormat | undefined;
  if (currentFormatRaw !== undefined) {
    if (typeof currentFormatRaw !== "string" || !CONTENT_FORMATS.includes(currentFormatRaw as ContentFormat)) {
      return { valid: false, message: "Format actuel invalide." };
    }
    currentFormat = currentFormatRaw as ContentFormat;
  }

  return {
    valid: true,
    value: { ideaId, presetId, tone: tone as GenerationTone, length: length as GenerationLength, instructions, currentText, currentFormat },
  };
}
