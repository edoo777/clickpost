import type { BrandProfile } from "@/types/brand";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { SocialAccount } from "@/types/dashboard";
import type { Locale } from "@/lib/i18n/locale";
import type { Theme } from "@/types/theme";
import type { CopilotHistoryItem } from "@/lib/ai/validate-copilot-request";
import { buildBrandContextLines, buildLanguageInstruction } from "@/lib/ai/prompt-context";

export interface CopilotPromptInput {
  brand: BrandProfile;
  connectedAccounts: SocialAccount[];
  themes: Theme[];
  ideas: { title: string; status: string; platform?: string; format?: ContentFormat }[];
  publications: { theme: string; scheduledFor: string; platform: string; status: string }[];
  message: string;
  history?: CopilotHistoryItem[];
  /** Langue attendue de la réponse (`profiles.ui_locale`) — voir buildLanguageInstruction. */
  language: Locale;
  /** Compléments configurables depuis l'espace Admin (voir src/lib/admin/prompt-overrides.ts) —
   * systemPromptOverride est prépendu, extraInstructions est ajouté après les règles de base :
   * jamais un remplacement des règles existantes. Vides par défaut. */
  systemPromptOverride?: string;
  extraInstructions?: string;
}

function buildConnectedAccounts(connectedAccounts: SocialAccount[]): string | null {
  if (connectedAccounts.length === 0) return null;
  return `Comptes connectés : ${connectedAccounts
    .slice(0, 8)
    .map((account) => `${account.platform} (${account.handle})`)
    .join(", ")}`;
}

function buildThemes(themes: Theme[]): string | null {
  if (themes.length === 0) return null;
  return `Thématiques actives : ${themes
    .slice(0, 8)
    .map((theme) => `${theme.label}${theme.objective ? ` (${theme.objective})` : ""}`)
    .join(", ")}`;
}

function buildIdeas(ideas: CopilotPromptInput["ideas"]): string | null {
  if (ideas.length === 0) return null;
  return `Idées existantes : ${ideas
    .slice(0, 8)
    .map((idea) => `« ${idea.title} »${idea.platform ? ` pour ${idea.platform}` : ""}${idea.format ? ` (${idea.format})` : ""}`)
    .join(" ; ")}`;
}

function buildPublications(publications: CopilotPromptInput["publications"]): string | null {
  if (publications.length === 0) return null;
  return `Publications planifiées/existantes : ${publications
    .slice(0, 8)
    .map((publication) => `${publication.theme} le ${publication.scheduledFor} sur ${publication.platform} (${publication.status})`)
    .join(" ; ")}`;
}

export function buildCopilotPrompt(input: CopilotPromptInput) {
  const systemLines = [
    input.systemPromptOverride ? `Note de l'administrateur ClickPost : ${input.systemPromptOverride}` : null,
    "Tu es ClickPost Editorial Copilot, un assistant éditorial IA francophone et stratégique.",
    "Ton rôle est d'aider un responsable éditorial ou un community manager à planifier, améliorer et convertir du contenu en respectant la marque, le ton et les objectifs marketing.",
    "Tu dois exploiter le contexte de la marque, des idées, des publications et du calendrier éditorial fournis par l'application.",
    "Réponds toujours de manière structurée, actionnable et tournée vers le travail réel en ClickPost.",
    "Suggère des actions concrètes quand c'est pertinent : enregistrer une idée, ouvrir l'Atelier, préparer un planning, transformer un contenu existant, ou améliorer un hook.",
    "Ne réponds jamais de façon générique. Si le contexte reste insuffisant, demande des précisions sur la marque, les réseaux ou les objectifs.",
    buildLanguageInstruction(input.language),
    input.extraInstructions ? `Instructions complémentaires (configurées par l'administrateur ClickPost) : ${input.extraInstructions}` : null,
  ].filter((line): line is string => Boolean(line));

  const userLines = [
    "Contexte de marque :",
    ...buildBrandContextLines(input.brand),
    buildConnectedAccounts(input.connectedAccounts),
    buildThemes(input.themes),
    buildIdeas(input.ideas),
    buildPublications(input.publications),
    "---",
    `Demande : ${input.message}`,
  ].filter((line): line is string => Boolean(line));

  const historyLines = input.history?.length
    ? ["Historique de la conversation :", ...input.history.map((item) => `${item.role === "user" ? "Utilisateur" : "Copilote"} : ${item.content}`)]
    : [];

  return {
    system: systemLines.join("\n"),
    user: [...userLines, ...historyLines].join("\n"),
  };
}
