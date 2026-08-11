import type { CopilotHistoryItem } from "@/lib/ai/validate-copilot-request";

export interface CopilotApiRequest {
  brandId: string;
  message: string;
  history?: CopilotHistoryItem[];
}

export interface CopilotApiResponse {
  status: "ok";
  text: string;
}

export interface CopilotApiErrorResponse {
  status: "error";
  code: string;
  message: string;
}

export async function runCopilotConversation(payload: CopilotApiRequest): Promise<CopilotApiResponse> {
  const response = await fetch("/api/ia/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as CopilotApiResponse | CopilotApiErrorResponse | null;
  if (!data || data.status !== "ok") {
    throw new Error(data?.message ?? `Erreur réseau (${response.status})`);
  }
  return data;
}
