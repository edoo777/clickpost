import type { NoteQuickActionRequestInput, PublicationQuickActionRequestInput, QuickActionRequestInput } from "@/lib/ai/quick-actions";

export interface QuickActionSuccess {
  status: "ok";
  items: string[];
}
export interface QuickActionFailure {
  status: "error";
  code: string;
  message: string;
}
export type QuickActionOutcome = QuickActionSuccess | QuickActionFailure;

async function postQuickAction(
  input: QuickActionRequestInput | NoteQuickActionRequestInput | PublicationQuickActionRequestInput
): Promise<QuickActionOutcome> {
  try {
    const response = await fetch("/api/ia/banque/quick-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => null)) as QuickActionOutcome | null;
    if (!data || data.status !== "ok") {
      return { status: "error", code: data?.code ?? `http_${response.status}`, message: data?.message ?? "Erreur inconnue." };
    }
    return data;
  } catch {
    return { status: "error", code: "network_error", message: "Connexion impossible — vérifiez votre réseau." };
  }
}

/** Appel client unique vers /api/ia/banque/quick-action — jamais d'appel direct à Claude depuis
 * le navigateur, jamais déclenché ailleurs qu'au clic explicite sur une action du menu
 * « Améliorer avec l'IA » (voir QuickActionsMenu.tsx / BulkQuickActionModal.tsx). */
export async function runQuickAction(input: QuickActionRequestInput): Promise<QuickActionOutcome> {
  return postQuickAction(input);
}

/** Même route, même architecture, catalogue d'actions distinct — voir NoteQuickActionsMenu.tsx. */
export async function runNoteQuickAction(input: NoteQuickActionRequestInput): Promise<QuickActionOutcome> {
  return postQuickAction(input);
}

/** Même route, même architecture, troisième catalogue d'actions — voir ClaudeGenerationPanel.tsx
 * (« Nouvelle publication », mode Claude). */
export async function runPublicationQuickAction(input: PublicationQuickActionRequestInput): Promise<QuickActionOutcome> {
  return postQuickAction(input);
}
