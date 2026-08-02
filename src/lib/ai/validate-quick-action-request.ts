import { ALL_NOTE_QUICK_ACTION_KEYS, ALL_QUICK_ACTION_KEYS, type NoteQuickActionKind, type QuickActionKind } from "@/lib/ai/quick-actions";
import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "threads", "pinterest", "other"];
const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 800;
/** Une note peut être bien plus longue qu'une description d'idée — plafond généreux mais borné,
 * cohérent avec les autres limites de texte envoyées à Claude côté serveur. */
const MAX_NOTE_CONTENT_LENGTH = 8000;

export interface ValidatedQuickActionRequest {
  action: QuickActionKind;
  title: string;
  description?: string;
  brandTone?: string;
  targetPlatform?: SocialPlatform;
}

export type QuickActionRequestValidation = { valid: true; value: ValidatedQuickActionRequest } | { valid: false; message: string };

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
}

export function validateQuickActionRequest(body: unknown): QuickActionRequestValidation {
  if (typeof body !== "object" || body === null) return { valid: false, message: "Corps de requête invalide." };
  const record = body as Record<string, unknown>;

  const action = record.action;
  if (typeof action !== "string" || !ALL_QUICK_ACTION_KEYS.includes(action as QuickActionKind)) {
    return { valid: false, message: "Action IA rapide invalide." };
  }

  const title = boundedText(record.title, MAX_TITLE_LENGTH);
  if (!title) return { valid: false, message: "Titre requis." };

  const description = boundedText(record.description, MAX_TEXT_LENGTH);
  const brandTone = boundedText(record.brandTone, 200);

  let targetPlatform: SocialPlatform | undefined;
  if (record.targetPlatform !== undefined) {
    if (typeof record.targetPlatform !== "string" || !ALL_PLATFORMS.includes(record.targetPlatform as SocialPlatform)) {
      return { valid: false, message: "Plateforme cible invalide." };
    }
    targetPlatform = record.targetPlatform as SocialPlatform;
  }
  if (action === "adapt_platform" && !targetPlatform) {
    return { valid: false, message: "Plateforme cible requise pour cette action." };
  }

  return { valid: true, value: { action: action as QuickActionKind, title, description, brandTone, targetPlatform } };
}

export interface ValidatedNoteQuickActionRequest {
  action: NoteQuickActionKind;
  title?: string;
  content: string;
  brandTone?: string;
}

export type NoteQuickActionRequestValidation =
  | { valid: true; value: ValidatedNoteQuickActionRequest }
  | { valid: false; message: string };

export function isNoteQuickActionKind(action: unknown): action is NoteQuickActionKind {
  return typeof action === "string" && ALL_NOTE_QUICK_ACTION_KEYS.includes(action as NoteQuickActionKind);
}

export function validateNoteQuickActionRequest(body: unknown): NoteQuickActionRequestValidation {
  if (typeof body !== "object" || body === null) return { valid: false, message: "Corps de requête invalide." };
  const record = body as Record<string, unknown>;

  const action = record.action;
  if (!isNoteQuickActionKind(action)) return { valid: false, message: "Action IA rapide invalide." };

  const content = boundedText(record.content, MAX_NOTE_CONTENT_LENGTH);
  if (!content) return { valid: false, message: "Contenu requis." };

  const title = boundedText(record.title, MAX_TITLE_LENGTH);
  const brandTone = boundedText(record.brandTone, 200);

  return { valid: true, value: { action, title, content, brandTone } };
}
