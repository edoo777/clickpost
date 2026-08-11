import type { BrandProfile } from "@/types/brand";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { SocialAccount } from "@/types/dashboard";
import type { Theme } from "@/types/theme";
import type { CopilotHistoryItem } from "@/lib/ai/validate-copilot-request";

export interface CopilotPromptInput {
  brand: BrandProfile;
  connectedAccounts: SocialAccount[];
  themes: Theme[];
  ideas: { title: string; status: string; platform?: string; format?: ContentFormat }[];
  publications: { theme: string; scheduledFor: string; platform: string; status: string }[];
  editorialCalendarSummary: string | null;
  message: string;
  history?: CopilotHistoryItem[];
}

function joinList(items: string[], label: string): string | null {
  if (items.length === 0) return null;
  return `${label} : ${items.slice(0, 6).join(", ")}`;
}

function buildBrandContext(brand: BrandProfile): string[] {
  return [
    `Marque : ${brand.name}`,
    `Secteur : ${brand.industry || "non précisé"}`,
    brand.positioning ? `Positionnement : ${brand.positioning}` : null,
    brand.valueProposition ? `Offre : ${brand.valueProposition}` : null,
    brand.description ? `Description : ${brand.description}` : null,
    `Audience cible : ${brand.targetAudience || "non précisée"}`,
    joinList(brand.productsAndServices, "Produits & services"),
    joinList(brand.priorityTopics, "Thématiques prioritaires"),
    joinList(brand.communicationGoals, "Objectifs marketing"),
    joinList(brand.topicsToAvoid, "Sujets à éviter"),
    joinList(brand.preferredPhrases, "Mots à privilégier"),
    joinList(brand.forbiddenWords, "Mots interdits"),
    joinList(brand.preferredCtas, "Appels à l'action préférés"),
    joinList(brand.socialPlatforms, "Réseaux sociaux"),
  ].filter((line): line is string => Boolean(line));
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
    "Tu es ClickPost Editorial Copilot, un assistant éditorial IA francophone et stratégique.",
    "Ton rôle est d'aider un responsable éditorial ou un community manager à planifier, améliorer et convertir du contenu en respectant la marque, le ton et les objectifs marketing.",
    "Tu dois exploiter le contexte de la marque, des idées, des publications et du calendrier éditorial fournis par l'application.",
    "Réponds toujours de manière structurée, actionnable et tournée vers le travail réel en ClickPost.",
    "Suggère des actions concrètes quand c'est pertinent : enregistrer une idée, ouvrir l'Atelier, préparer un planning, transformer un contenu existant, ou améliorer un hook.",
    "Ne réponds jamais de façon générique. Si le contexte reste insuffisant, demande des précisions sur la marque, les réseaux ou les objectifs.",
  ];

  const userLines = [
    "Contexte de marque :",
    ...buildBrandContext(input.brand),
    buildConnectedAccounts(input.connectedAccounts),
    buildThemes(input.themes),
    buildIdeas(input.ideas),
    buildPublications(input.publications),
    input.editorialCalendarSummary ? `Calendrier éditorial : ${input.editorialCalendarSummary}` : null,
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
