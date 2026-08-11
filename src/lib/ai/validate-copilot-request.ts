const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_ITEM_LENGTH = 1200;

type CopilotHistoryRole = "user" | "assistant";

export interface CopilotHistoryItem {
  role: CopilotHistoryRole;
  content: string;
}

export interface CopilotRequestInput {
  brandId: string;
  message: string;
  history?: CopilotHistoryItem[];
}

export type CopilotRequestValidation =
  | { valid: true; value: CopilotRequestInput }
  | { valid: false; message: string };

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
}

export function validateCopilotRequest(body: unknown): CopilotRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { valid: false, message: "Corps de requête invalide." };
  }

  const record = body as Record<string, unknown>;

  const brandId = record.brandId;
  if (typeof brandId !== "string" || !UUID_PATTERN.test(brandId)) {
    return { valid: false, message: "Identifiant de marque invalide." };
  }

  const message = boundedText(record.message, MAX_MESSAGE_LENGTH);
  if (!message) {
    return { valid: false, message: "Message invalide ou vide." };
  }

  let history: CopilotHistoryItem[] | undefined;
  if (record.history !== undefined) {
    if (!Array.isArray(record.history)) {
      return { valid: false, message: "Historique invalide." };
    }
    history = record.history
      .slice(0, MAX_HISTORY_ITEMS)
      .map((item) => {
        if (typeof item !== "object" || item === null) return null;
        const recordItem = item as Record<string, unknown>;
        const role = recordItem.role;
        const content = boundedText(recordItem.content, MAX_HISTORY_ITEM_LENGTH);
        if ((role !== "user" && role !== "assistant") || !content) return null;
        return { role, content } as CopilotHistoryItem;
      })
      .filter((item): item is CopilotHistoryItem => item !== null);
  }

  return { valid: true, value: { brandId, message, history } };
}
