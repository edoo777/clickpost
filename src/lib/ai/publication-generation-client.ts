import type { GenerationLength, GenerationTone } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

/** Appel client vers /api/ia/publications/generate — jamais d'appel direct à Claude depuis le
 * navigateur (même règle que banque-quick-action.ts). */

export interface PublicationGenerationRequestInput {
  brandId?: string;
  standaloneNiche?: string;
  platform: SocialPlatform;
  themeId?: string;
  adhocTheme?: string;
  contentType?: string;
  format: ContentFormat;
  objective?: string;
  audience?: string;
  tone?: GenerationTone;
  language?: string;
  length: GenerationLength;
  instructions?: string;
  existingTitle?: string;
  existingText?: string;
  existingCta?: string;
  existingHashtags?: string[];
}

export interface PublicationGenerationProposal {
  theme: string;
  objective: string;
  titles: string[];
  text: string;
  cta: string;
  hashtags: string[];
  formatSuggestion: string;
  mediaSuggestion: string;
}

export type PublicationGenerationOutcome =
  | { status: "ok"; proposal: PublicationGenerationProposal }
  | { status: "error"; code: string; message: string };

export async function runPublicationGeneration(input: PublicationGenerationRequestInput): Promise<PublicationGenerationOutcome> {
  try {
    const response = await fetch("/api/ia/publications/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => null)) as
      | { status: "ok"; proposal: PublicationGenerationProposal }
      | { status: "error"; code?: string; message?: string }
      | null;
    if (!data || data.status !== "ok") {
      return { status: "error", code: (data as { code?: string })?.code ?? `http_${response.status}`, message: (data as { message?: string })?.message ?? "Erreur inconnue." };
    }
    return data;
  } catch {
    return { status: "error", code: "network_error", message: "Connexion impossible — vérifiez votre réseau." };
  }
}
