const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SELECTED_TEXT_LENGTH = 2000;
const MAX_INSTRUCTION_LENGTH = 200;

export interface RewriteSelectionRequestInput {
  ideaId: string;
  selectedText: string;
  instruction: string;
}

export type RewriteSelectionRequestValidation =
  | { valid: true; value: RewriteSelectionRequestInput }
  | { valid: false; message: string };

export function validateRewriteSelectionRequest(body: unknown): RewriteSelectionRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { valid: false, message: "Corps de requête invalide." };
  }

  const record = body as Record<string, unknown>;

  const ideaId = record.ideaId;
  if (typeof ideaId !== "string" || !UUID_PATTERN.test(ideaId)) {
    return { valid: false, message: "Identifiant d'idée invalide." };
  }

  const selectedText = record.selectedText;
  if (typeof selectedText !== "string" || !selectedText.trim()) {
    return { valid: false, message: "Texte sélectionné invalide." };
  }

  const instruction = record.instruction;
  if (typeof instruction !== "string" || !instruction.trim()) {
    return { valid: false, message: "Instruction invalide." };
  }

  return {
    valid: true,
    value: {
      ideaId,
      selectedText: selectedText.trim().slice(0, MAX_SELECTED_TEXT_LENGTH),
      instruction: instruction.trim().slice(0, MAX_INSTRUCTION_LENGTH),
    },
  };
}
